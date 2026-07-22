from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls", namespace="accounts")),
    path("api/engine/", include("engine.urls", namespace="session")),
    path("api/analytics/", include("analytics.urls", namespace="analytics")),
]
