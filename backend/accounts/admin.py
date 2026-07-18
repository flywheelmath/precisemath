from django.contrib import admin

from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "uuid", "is_staff", "is_superuser", "last_login")
    search_fields = ("last_name", "first_name", "username", "email")
    list_filter = ("is_staff", "is_active")


