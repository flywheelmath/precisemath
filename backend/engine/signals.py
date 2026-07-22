import uuid
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models_session import Player
from .utils.pseudonyms import generate_pseudonym

User = get_user_model()

@receiver(post_save, sender=User)
def provision_player(sender, instance, created, **kwargs):
    """
    Application trigger: Automatically generates player object when a new user is saved to the database.
    """
    if created:
        Player.objects.get_or_create(
            user=instance,
            defaults={
                "is_guest": false,
                "pseudonym": generate_pseudonym(str(instance.id)),
            }
        )
