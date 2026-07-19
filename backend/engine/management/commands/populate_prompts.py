import json
from django.core.management.base import BaseCommand
from django.apps import apps
from django.core.exceptions import ObjectDoesNotExist
from django.core.cache import cache


class Command(BaseCommand):
    """
    A dedicated management command to populate the Prompt model.
    This script is necessary because finding the correct SkillLevel for each
    prompt requires a nested lookup using category, skill, and skill level slugs.
    It also handles an optional 'rank' field for ordering prompts.
    """

    help = "Imports prompts from a specified JSON file."

    def add_arguments(self, parser):
        parser.add_argument(
            "json_file_path", type=str, help="The path to the prompts JSON file."
        )

    def handle(self, *args, **options):
        json_file_path = options["json_file_path"]

        Category = apps.get_model("fluency_games", "Category")
        Skill = apps.get_model("fluency_games", "Skill")
        SkillLevel = apps.get_model("fluency_games", "SkillLevel")
        Prompt = apps.get_model("fluency_games", "Prompt")

        with open(json_file_path, "r") as f:
            data = json.load(f)

        self.stdout.write("Importing prompts...")
        prompts_created = 0
        prompts_updated_or_skipped = 0

        for item_data in data:
            try:
                category = Category.objects.get(slug=item_data["category_slug"])
                skill = Skill.objects.get(
                    category=category, slug=item_data["skill_slug"]
                )
                skill_level = SkillLevel.objects.get(
                    skill=skill, slug=item_data["skill_level_slug"]
                )

                lookup_params = {"skill_level": skill_level, "data": item_data["data"]}

                try:
                    prompt_obj = Prompt.objects.get(**lookup_params)

                    new_prompt_rank = item_data.get(
                        "prompt_rank", prompt_obj.prompt_rank
                    )
                    if prompt_obj.prompt_rank != new_prompt_rank:
                        prompt_obj.prompt_rank = new_prompt_rank
                        prompt_obj.save(update_fields=["prompt_rank"])

                    prompts_updated_or_skipped += 1

                except Prompt.DoesNotExist:
                    create_params = lookup_params.copy()
                    if "prompt_rank" in item_data:
                        create_params["prompt_rank"] = item_data["prompt_rank"]
                    if "correct_response" in item_data:
                        create_params["correct_response"] = item_data[
                            "correct_response"
                        ]
                    if "operand1" in item_data:
                        create_params["operand1"] = item_data[
                                "operand1"
                        ]
                    if "operand2" in item_data:
                        create_params["operand2"] = item_data[
                                "operand2"
                        ]


                    Prompt.objects.create(**create_params)
                    prompts_created += 1

            except ObjectDoesNotExist as e:
                self.stderr.write(
                    self.style.ERROR(
                        f"Could not find a related object for prompt data {item_data}. Error: {e}"
                    )
                )
                continue
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(
                        f"An unexpected error occurred for item {item_data}: {type(e).__name__}: {e}"
                    )
                )
                continue

        self.stdout.write(
            self.style.SUCCESS(
                f"Data import complete. Created: {prompts_created}, Updated or Skipped: {prompts_updated_or_skipped}."
            )
        )
        self.stdout.write(self.style.WARNING("Clearing the cache..."))
        cache.clear()
        self.stdout.write(self.style.SUCCESS("Cache cleared."))
