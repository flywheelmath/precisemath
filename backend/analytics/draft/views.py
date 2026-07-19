import datetime
import statistics
from collections import defaultdict
from django.core.cache import cache
from django.db.models import Count, F, Q, Sum
from django.db.models.functions import Cast, Extract, TruncDay
from django.views.decorators.cache import cache_page, never_cache
from django.utils import timezone
from django.utils.decorators import method_decorator
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from .models import UserSkillProfile
from engine.models_prompt import (
    Category,
    Prompt,
    Skill,
    SkillLevel,
)
from engine.models_session import (
    PromptResponse,
    Session,
)
from .serializers import (
    ClaimSessionsSerializer,
    PromptSerializer,
    SessionCreateSerializer,
    SkillLevelDataSerializer,
    StudentListSerializer,
    UserProfileSerializer,
    UserSerializer,
)
from .services import compute_player_skill_level

User = get_user_model()

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        """
        Handle partial updates to the user profile.
        """
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request):
        """
        Handle user account deletion.
        """
        user = request.user
        if hasattr(user, "student"):
            return Response(
                    {"detail": "Students are not permitted to delete their own accounts."},
                    status=status.HTTP_403_FORBIDDEN
                    )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@method_decorator(never_cache, name="get")
class UserSkillProfileView(APIView):
    """
    Provides the currently authenticated user's skill profile data.
    """

    permission_classes = [AllowAny]

    def get(self, request, category_slug=None, skill_slug=None, format=None):
        """
        Serialize and return the user object from the request.
        """
        try:
            skill = Skill.objects.get(category__slug=category_slug, slug=skill_slug)
        except Skill.DoesNotExist:
            return Response(
                {"error": "Skill not found."}, status=status.HTTP_404_NOT_FOUND
            )

        user_skill_level = 99
        if request.user.is_authenticated:
            profile, created = UserSkillProfile.objects.get_or_create(
                user=request.user, skill=skill
            )
            user_skill_level = profile.user_skill_level
        user_data = UserSerializer(request.user).data

        # temporarily override user skill level
        #user_skill_level = 99

        return Response(
            {
                "user": user_data,
                "user_skill_level": user_skill_level,
            }
        )

def get_target_user(request):
    target_user = request.user
    student_id = request.query_params.get('student_id')

    if student_id:
        is_authorized = User.objects.filter(
            id=student_id,
            student__sectionenrollment__section__teacher__user=request.user
        ).exists()

        if not is_authorized:
            raise PermissionDenied("You are not authorized to view this student's data.")

        target_user = User.objects.get(id=student_id)

    return target_user

class CelerationChartDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, category_slug, skill_slug):
        target_user = get_target_user(request)

        user_sessions = Session.objects.filter(
                user=target_user,
                skill__slug=skill_slug,
                skill__category__slug=category_slug
        ).order_by("end_time")

        sessions_by_day = defaultdict(list)
        for session in user_sessions:
            day = session.end_time.strftime("%Y-%m-%d")
            sessions_by_day[day].append(session)

        labels = []
        average_data = []
        best_data = []

        for day, sessions in sorted(sessions_by_day.items()):
#            total_responses_in_day = sum(s.total_correct + s.total_incorrect for s in sessions)
#            if total_responses_in_day < 3:
#                continue

            daily_rates = []
            total_correct_in_day = 0
            total_duration_min = 0

            for s in sessions:
                total_correct_in_day += s.total_correct
                duration_min = s.duration.total_seconds() / 60 if s.duration else 0
                total_duration_min += duration_min
                if duration_min > 0:
                    daily_rates.append(s.total_correct / duration_min)

            if total_duration_min > 0:
                average_rate = total_correct_in_day / total_duration_min
                best_rate = max(daily_rates) if daily_rates else 0

                labels.append(day)
                average_data.append(round(average_rate, 1))
                best_data.append(round(best_rate, 1))

        response_payload = {
                "labels": labels,
                "average_data": average_data,
                "best_data": best_data,
                }

        return Response(response_payload)

class RollingAverageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, category_slug, skill_slug):
        target_user = get_target_user(request)

        WINDOW_SIZE = 100
        DATA_POINTS = 200
        recent_responses_qs = PromptResponse.objects.filter(
                session__user=target_user,
                prompt__skill_level__skill__slug=skill_slug,
                prompt__skill_level__skill__category__slug=category_slug,
        ).order_by("-session__end_time", "-sequence_index")[:DATA_POINTS + WINDOW_SIZE]

        responses = list(recent_responses_qs)
        responses.reverse()

        if len(responses) < WINDOW_SIZE:
            return Response({"rate_data": [], "accuracy_data": []})

        rate_data = []
        accuracy_data = []
        for i in range(len(responses) - WINDOW_SIZE + 1):
            window = responses[i : i + WINDOW_SIZE]
            correct_in_window = sum(1 for r in window if r.was_correct)
            time_min = sum(r.time_spent_ms for r in window) / 60000
            rate = correct_in_window / time_min if time_min > 0 else 0
            rate_data.append(round(rate, 2))

            accuracy = (correct_in_window / WINDOW_SIZE) * 100
            accuracy_data.append(round(accuracy, 0))

        return Response({
            "rate_data": rate_data[-DATA_POINTS:],
            "accuracy_data": accuracy_data[-DATA_POINTS:]
            })


CACHE_TIMEOUT = 300

@method_decorator(cache_page(CACHE_TIMEOUT), name="dispatch")
class ProfileSkillDetailView(APIView):
    """
    Composite view that joins data from CelerationChartDataView and RollingAverageView for the skill detail page.
    """
    permission_classes = [IsAuthenticated]

    def _get_fact_grid_data(self, user, category_slug, skill_slug):
        """
        Helper method to calculate fact grid accuracy.
        """
        if category_slug != "math-facts":
            return None

        past_month = timezone.now() - datetime.timedelta(days=30)
        responses = PromptResponse.objects.filter(
                session__user=user,
                session__end_time__gte=past_month,
                prompt__skill_level__skill__category__slug=category_slug,
                prompt__skill_level__skill__slug=skill_slug,
                prompt__operand1__isnull=False
        )

        correct_responses = [r for r in responses if r.was_correct and r.time_spent_ms > 0]
        if not correct_responses:
            return { "accuracy_grid": {}, "fluency_grid": {} }

        digit_rates = []
        for r in correct_responses:
            num_digits = 1 + 0.15 * (len(str(r.prompt.correct_response_number)) - 1)
            rate = num_digits / r.time_spent_ms
            digit_rates.append(rate)

        mean_rate = statistics.mean(digit_rates)
        stdev_rate = statistics.stdev(digit_rates) if len(digit_rates) > 1 else 0

        fact_stats = defaultdict(lambda: {
            "correct": 0,
            "total": 0,
            "z_scores": []
            })

        for r in responses:
            operand1 = r.prompt.operand1
            operand2 = r.prompt.operand2
            fact_key = f"{operand1}x{operand2}"
            fact_stats[fact_key]["total"] += 1
            if r.was_correct:
                fact_stats[fact_key]["correct"] += 1
                if r.time_spent_ms > 0:
                    num_digits = 1 + 0.15 * (len(str(r.prompt.correct_response_number)) - 1)
                    rate = num_digits / r.time_spent_ms
                    if stdev_rate > 0:
                        z_score = (rate - mean_rate) / stdev_rate
                        fact_stats[fact_key]["z_scores"].append(z_score)

        accuracy_grid = {}
        fluency_grid = {}
        for key, stats in fact_stats.items():
            if stats["total"] > 0:
                accuracy_grid[key] = round(stats["correct"] / stats["total"], 2)

            if stats["z_scores"]:
                fluency_grid[key] = round(statistics.mean(stats["z_scores"]), 2)

        return {
                "accuracy_grid": accuracy_grid,
                "fluency_grid": fluency_grid,
                }

    def get(self, request, category_slug, skill_slug):
        celeration_view = CelerationChartDataView()
        celeration_response = celeration_view.get(request, category_slug=category_slug, skill_slug=skill_slug)

        rolling_view = RollingAverageView()
        rolling_response = rolling_view.get(request, category_slug=category_slug, skill_slug=skill_slug)

        math_fact_grid_data = self._get_fact_grid_data(request.user, category_slug, skill_slug)

        return Response({
            "celeration_chart": celeration_response.data,
            "rolling_chart": rolling_response.data,
            "math_fact_accuracy_grid": math_fact_grid_data.get("accuracy_grid") if math_fact_grid_data else None,
            "math_fact_fluency_grid": math_fact_grid_data.get("fluency_grid") if math_fact_grid_data else None,
            })


class ProfileSkillDetailView(APIView):
    """
    Composite view that joins data from CelerationChartDataView and
    RollingAverageView for the skill detail page.
    """
    permission_classes = [IsAuthenticated]

    def _get_fact_grid_data(self, user, category_slug, skill_slug):
        """
        Helper method to calculate fact grid accuracy and fluency.

        """
        if category_slug != "math-facts":
            return None

        past_month = timezone.now() - datetime.timedelta(days=30)
        responses = PromptResponse.objects.filter(
            session__user=user,
            session__end_time__gte=past_month,
            prompt__skill_level__skill__category__slug=category_slug,
            prompt__skill_level__skill__slug=skill_slug,
            prompt__operand1__isnull=False
        )

        correct_responses = [r for r in responses if r.was_correct and r.time_spent_ms > 0]
        if not correct_responses:
            return { "accuracy_grid": {}, "fluency_grid": {} }

        digit_rates = []
        for r in correct_responses:
            num_digits = 1 + 0.15 * (len(str(r.prompt.correct_response_number)) - 1)
            rate = num_digits / r.time_spent_ms
            digit_rates.append(rate)

        mean_rate = statistics.mean(digit_rates)
        stdev_rate = statistics.stdev(digit_rates) if len(digit_rates) > 1 else 0

        fact_stats = defaultdict(lambda: {"correct": 0, "total": 0, "z_scores": []})

        for r in responses:
            fact_key = f"{r.prompt.operand1}x{r.prompt.operand2}"
            fact_stats[fact_key]["total"] += 1
            if r.was_correct:
                fact_stats[fact_key]["correct"] += 1
                if r.time_spent_ms > 0:
                    num_digits = 1 + 0.15 * (len(str(r.prompt.correct_response_number)) - 1)
                    rate = num_digits / r.time_spent_ms
                    if stdev_rate > 0:
                        z_score = (rate - mean_rate) / stdev_rate
                        fact_stats[fact_key]["z_scores"].append(z_score)

        accuracy_grid = {k: round(v["correct"] / v["total"], 2) for k, v in fact_stats.items() if v["total"] > 0}
        fluency_grid = {k: round(statistics.mean(v["z_scores"]), 2) for k, v in fact_stats.items() if v["z_scores"]}

        return {"accuracy_grid": accuracy_grid, "fluency_grid": fluency_grid}

    def get(self, request, category_slug, skill_slug):
        target_user = get_target_user(request)

        celeration_view = CelerationChartDataView()
        celeration_response = celeration_view.get(request, category_slug=category_slug, skill_slug=skill_slug)

        rolling_view = RollingAverageView()
        rolling_response = rolling_view.get(request, category_slug=category_slug, skill_slug=skill_slug)

        math_fact_grid_data = self._get_fact_grid_data(target_user, category_slug, skill_slug)

        return Response({
            "celeration_chart": celeration_response.data,
            "rolling_chart": rolling_response.data,
            "math_fact_accuracy_grid": math_fact_grid_data.get("accuracy_grid") if math_fact_grid_data else None,
            "math_fact_fluency_grid": math_fact_grid_data.get("fluency_grid") if math_fact_grid_data else None,
        })
