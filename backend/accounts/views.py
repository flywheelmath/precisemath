import gc
import hashlib
import uuid
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout, update_session_auth_hash
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from engine.models_session import Player

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth_login(request):
    """
    Accepts raw Google id token,
    validates it cryptographically,
    hashes the email address in volatile memory,
    purges the PII,
    logs user into zero-knowledge session.
    If a link_token is provided and valid,
    upgrades the session by attaching a cached password hash.
    """
    token = request.data.get("id_token")
    link_token = request.data.get("link_token")

    if not token:
        return Response({"error": "Missing identification token"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        id_info = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        raw_email = id_info.get("email", "").strip().lower()
        if not raw_email:
            return Response({"error": "Invalid payload structure from Google"}, status=status.HTTP_400_BAD_REQUEST)

        hasher = hashlib.sha256()
        salted_input = raw_email + settings.SHARED_ANONYMIZATION_SALT
        hasher.update(salted_input.encode("utf-8"))
        hashed_username = hasher.hexdigest()

        del raw_email
        del id_info
        gc.collect()

        user, created = User.objects.get_or_create(username=hashed_username)

        if not user.has_oauth:
            user.has_oauth = True
            user.save(update_fields=["has_oauth"])

        if link_token:
            cache_key = f"link_token_{link_token}"
            cached_data = cache.get(cache_key)

            if cached_data and cached_data.get("username_hash") == hashed_username:
                user.password = cached_data.get("password_hash")
                user.has_password = True
                user.save(update_fields=["password", "has_password"])
                cache.delete(cache_key)

        login(request, user)

        response_payload = {
            "status": "success",
            "uuid": str(user.uuid),
            "new_account": created
        }

        return Response(response_payload, status=status.HTTP_200_OK)

    except ValueError as e:
        return Response({"error": "Token signature validation failed"}, status=status.HTTP_403_FORBIDDEN)

@api_view(["POST"])
@permission_classes([AllowAny])
def signup_with_credentials(request):
    """
    Handles self-registration.
    If the hashed email already exists (due to Google registration),
    generates short-lived link token for step-up authentication.
    """
    raw_username = request.data.get("username", "").strip().lower()
    raw_password = request.data.get("password")

    if not raw_username:
        return Response({"error": "Username or email is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(raw_password)
    except ValidationError as e:
        return Response({"error": e.messages}, status=status.HTTP_400_BAD_REQUEST)

    hasher = hashlib.sha256()
    salted_input = raw_username + settings.SHARED_ANONYMIZATION_SALT
    hasher.update(salted_input.encode("utf-8"))
    hashed_username = hasher.hexdigest()

    try:
        existing_user = User.objects.get(username=hashed_username)

        if existing_user.has_oauth and not existing_user.has_password:
            link_token = str(uuid.uuid4())
            safe_password_hash = make_password(raw_password)
            cache.set(
                f"link_token_{link_token}",
                {
                    "username_hash": hashed_username,
                    "password_hash": safe_password_hash,
                },
                timeout=600
            )

            return Response({
                "error": "Account already exists.",
                "requires_google_link": True,
                "link_token": link_token,
            }, status=status.HTTP_409_CONFLICT)

        else:
            return Response({
                "error": "Username or email is already taken."
            }, status=status.HTTP_400_BAD_REQUEST)

    except User.DoesNotExist:
        pass

    user = User.objects.create_user(username=hashed_username, password=raw_password)
    user.has_password = True
    user.save(update_fields=["has_password"])

    login(request, user)

    return Response({
        "status": "success",
        "uuid": str(user.uuid),
    }, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_with_credentials(request):
    """
    Handles self-registering public users authenticating via form-based custom username and password strings using the deterministic zero-knowledge hash.
    """
    raw_username = request.data.get("username", "").strip().lower()
    password = request.data.get("password")

    if not raw_username or not password:
        return Response({"error": "Username and password fields are required"}, status=status.HTTP_400_BAD_REQUEST)

    hasher = hashlib.sha256()
    salted_input = raw_username + settings.SHARED_ANONYMIZATION_SALT
    hasher.update(salted_input.encode("utf-8"))
    hashed_username = hasher.hexdigest()

    try:
        user_obj = User.objects.get(username=hashed_username)

        if user_obj.has_oauth and not user_obj.has_password:
            link_token = str(uuid.uuid4())
            safe_password_hash = make_password(password)
            cache.set(
                f"link_token_{link_token}",
                {
                    "username_hash": hashed_username,
                    "password_hash": safe_password_hash,
                },
                timeout=600
            )
            return Response({
                "error": "This account uses Google Sign-In. Sign in with Google to link a password.",
                "requires_google_link": True,
                "link_token": link_token,
                }, status=status.HTTP_409_CONFLICT)

    except User.DoesNotExist:
        return Response({"error": "Account not found."}, status=status.HTTP_404_NOT_FOUND)

    user = authenticate(request, username=hashed_username, password=password)

    if user is not None:
        login(request, user)
        response_payload = {
            "status": "success",
            "uuid": str(user.uuid),
        }
        return Response(response_payload, status=status.HTTP_200_OK)

    return Response({"error": "Invalid password."}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(["POST"])
@permission_classes([AllowAny])
def uuid_batch_sync(request):
    """
    Privileged batch endpoint for UUID sync script.
    Accepts an array of objects: [{"username": "sha256_hash", "uuid": "roster_uuid"}]
    """
    auth_header = request.headers.get("Authorization", "")
    expected_token = f"Token {settings.UUID_SYNC_TOKEN}"

    if auth_header != expected_token:
        return Response({"error": "Unauthorized sync signature"}, status=status.HTTP_401_UNAUTHORIZED)

    roster_data = request.data.get("roster", [])
    if not isinstance(roster_data, list):
        return Response({"error": "Invalid format. Expected a list under the key 'roster'"}, status=status.HTTP_400_BAD_REQUEST)

    success_count = 0
    errors = []

    try:
        with transaction.atomic():
            for index, item in enumerate(roster_data):
                username = item.get("username")
                uuid = item.get("uuid")

                if not username or not uuid:
                    errors.append(f"Row {index}: Missing required username or uuid.")
                    continue

                username_clean = username.strip().lower()
                user, clean = User.objects.update_or_create(
                    username=username_clean,
                    defaults={"uuid": uuid}
                )
                success_count += 1

    except Exception as e:
        return Response({"error": f"Database transaction failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    response_payload = {
        "status": "complete",
        "processed_records": success_count,
        "errors": errors
    }

    return Response(response_payload, status=status.HTTP_200_OK)

@api_view(["GET"])
def get_current_profile(request):
    """
    Checks the incoming session cookie or falls back to X-Guest-Token header.
    Serves a unified zero-knowledge identity metadata block back to the UI.
    """
    user = request.user
    guest_token = request.headers.get("X-Guest-Token")

    try:
        player = Player.objects.resolve_player(user, guest_token)

        return Response({
            "id": str(player.domain_identifier),
            "is_guest": player.is_guest,
            "display_name": player.pseudonym,
            "pin": str(player.domain_identifier)[-4:].upper(),
            "isAuthenticated": user.is_authenticated,
        }, status=status.HTTP_200_OK)

    except ValidationError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def session_logout(request):
    """
    Flushes the active session cookie out of the browser context.
    """
    logout(request)
    return Response({"status": "logged_out"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def password_reset(request):
    user = request.user
    new_password = request.data.get("new_password")
    current_password = request.data.get("current_password")
    google_id_token = request.data.get("google_id_token")

    if not new_password:
        return Response({"error": "New password is required."}, status=status.HTTP_400_BAD_REQUEST)

    if google_id_token and user.has_oauth:
        try:
            id_info = id_token.verify_oauth2_token(
                google_id_token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
            raw_email = id_info.get("email", "").strip().lower()

            hasher = hashlib.sha256()
            salted_input = raw_email + settings.SHARED_ANONYMIZATION_SALT
            hasher.update(salted_input.encode("utf-8"))
            hashed_email = hasher.hexdigest()

            if hashed_email != user.username:
                return Response(
                    {"error": "This Google account does not match your active session."},
                    status=status.HTTP_403_FORBIDDEN
                )

        except ValueError:
            return Response(
                {"error": "Google token signature validation failed."},
                status=status.HTTP_403_FORBIDDEN
            )

    elif current_password:
        if not user.check_password(current_password):
            return Response(
                {"error": "Incorrect current password."},
                status=status.HTTP_403_FORBIDDEN
            )

    else:
        return Response(
            {"error": "You must either provide your current password or verify with Google."},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(new_password)
    user.has_password = True
    user.save(update_fields=["password", "has_password"])

    update_session_auth_hash(request, user)

    return Response({"status": "success"}, status=status.HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """
    Permanently severs the user's data from their identity before deleting the authentication record.
    """
    user = request.user

    with transaction.atomic():
        if hasattr(user, 'player'):
            player = user.player
            player.domain_identifier = uuid.uuid4()
            player.pseudonym = f"Deleted_account_{uuid.uuid4().hex[:8]}"
            player.save()

        user.delete()

    logout(request)

    return Response({"status": "deleted"}, status=status.HTTP_200_OK)
