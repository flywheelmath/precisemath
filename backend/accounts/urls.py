from django.urls import path
from . import views

app_name = "accounts"

urlpatterns = [
    path("google/", views.google_oauth_login, name="google_oauth_login"),
    path("login/", views.login_with_credentials, name="login_with_credentials"),
    path("signup/", views.signup_with_credentials, name="signup_with_credentials"),
    path("logout/", views.session_logout, name="logout"),
    path("password-reset/", views.password_reset, name="password_reset"),
    path("delete/", views.delete_account, name="delete_accout"),
    path("sync/uuid/", views.uuid_batch_sync, name="uuid_batch_sync"),
]
