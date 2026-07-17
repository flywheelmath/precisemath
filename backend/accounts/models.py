import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

"""
Usernames:
User models need to be FERPA-compliant.
The intention is for the backend to have zero knowledge of Personally Identifiable Information (PII).
In many instances, school-issued email addresses contain PII, so we don't write them to disk: we salt and hash them, and use the hashed string as a username.
Nor does the backend receive first or last names.
Because Django requires email, first_name and last_name fields for AbstractUser objects, the save() method populates those fields with empty strings.

UUID:
To securely map student performance metrics back to an external roster, which is NOT stored on the server, without exposing PII to the server, we use a separate, cryptographically secure UUID field.

For public users, a random UUIDv4 is generated on account creation.
For students whose hashes match hash values in the roster, we overwrite the server's UUID field with a UUID contained in the roster.
The only link between a student's identity and their database record is within the roster, which is stored on a district-controlled, FERPA-compliant platform.
"""

class User(AbstractUser):
    username = models.CharField(max_length=100, unique=True)
    uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    email = models.CharField(max_length=100, default="", blank=True)
    first_name = models.CharField(max_length=50, default="", blank=True)
    last_name = models.CharField(max_length=50, default="", blank=True)
    
    REQUIRED_FIELDS = []

    def save(self, *args, **kwargs):
        self.email = ""
        self.first_name = ""
        self.last_name = ""
        super().save(*args, **kwargs)

    def __str__(self):
        return f"User({self.username[:8]}...)"
