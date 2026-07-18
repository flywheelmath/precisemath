import hashlib
import gc
from django.conf import settings
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.contrib.auth import get_user_model

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
