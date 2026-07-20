import gc
import hashlib
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
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
    """
    token = request.data.get("id_token")
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

        login(request, user)

        response_payload = {
            "status": "success",
            "uuid": str(user.uuid),
            "new_account": created
        }

        return Response(response_payload, status=status.HTTP_200_OK)

    except ValueError:
        return Response({"error": "Token signature validation failed"}, status=status.HTTP_403_FORBIDDEN)

@api_view(["POST"])
@permission_classes([AllowAny])
def native_credentials_login(request):
    """
    Handles self-registering public users authenticating via form-based custom username and password strings.
    """
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response({"error": "Username and password fields are required"}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        response_payload = {
            "status": "success",
            "uuid": str(user.uuid),
        }
        return Response(response_payload, status=status.HTTP_200_OK)

    return Response({"error": "Invalid credentials supplied"}, status=status.HTTP_401_UNAUTHORIZED)

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
