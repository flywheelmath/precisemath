from django.urls import path
from . import views

app_name = "accounts"

urlpatterns = [
    path("google/", views.google_oauth_login, name="google_oauth_login"),
    path("login/", views.native_credentials_login, name="native_credentials_login"),
    path("sync/uuid/", views.uuid_batch_sync, name="uuid_batch_sync"),
]
