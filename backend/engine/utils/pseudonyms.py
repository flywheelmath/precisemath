import hashlib
from .constants import ADJECTIVES, NAMES

def generate_pseudonym(identifier: str) -> str:
    hash_int = int(hashlib.md5(str(identifier).encode()).hexdigest(), 16)
    adj = ADJECTIVES[hash_int % len(ADJECTIVES)]
    math_name = NAMES[hash_int % len(NAMES)]
    suffix = hash_int % 10000

    base_name = f"{adj}{math_name}{suffix}"

    from engine.models_session import Player

    final_name = base_name
    counter = 0

    while Player.objects.filter(pseudonym=final_name).exists():
        final_name = f"{base_name}{chr(97+ counter)}"
        counter += 1

    return final_name
