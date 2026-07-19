import json
from django.core.management.base import BaseCommand
from django.apps import apps
from django.core.exceptions import ObjectDoesNotExist, FieldDoesNotExist


class Command(BaseCommand):
    help = "Imports data from a specified JSON file into a specified model."

    def add_arguments(self, parser):
        parser.add_argument(
            "model_name", type=str, help="The app_label.ModelName of the model."
        )
        parser.add_argument(
            "json_file_path", type=str, help="The path to the JSON file."
        )
        parser.add_argument(
            "--unique_fields",
            type=str,
            help="Comma-separated unique fields for update_or_create.",
        )

    def handle(self, *args, **options):
        model_name_str = options["model_name"]
        json_file_path = options["json_file_path"]

        try:
            app_label, model_name = model_name_str.split(".")
            model = apps.get_model(app_label, model_name)
        except (LookupError, ValueError):
            self.stderr.write(self.style.ERROR(f"Model '{model_name_str}' not found."))
            return

        unique_fields_str = options.get("unique_fields")
        if not unique_fields_str:
            self.stderr.write(self.style.ERROR("Please provide --unique_fields."))
            return
        unique_fields = unique_fields_str.split(",")

        with open(json_file_path, "r") as f:
            data = json.load(f)

        self.stdout.write(f"Importing data for {model_name_str}...")

        for item_data in data:
            lookup_params = {}
            defaults = {}
            m2m_data = {}

            try:
                for field_key in unique_fields:
                    if (
                        model == apps.get_model("fluency_games", "SkillLevel")
                        and field_key == "skill_slug"
                    ):
                        category = apps.get_model(
                            "fluency_games", "Category"
                        ).objects.get(slug=item_data["category_slug"])
                        skill = apps.get_model("fluency_games", "Skill").objects.get(
                            category=category, slug=item_data["skill_slug"]
                        )
                        lookup_params["skill"] = skill
                    elif field_key.endswith("_slug"):
                        field_name = field_key.replace("_slug", "")
                        related_model = model._meta.get_field(field_name).related_model
                        lookup_params[field_name] = related_model.objects.get(
                            slug=item_data[field_key]
                        )
                    else:
                        lookup_params[field_key] = item_data[field_key]
            except ObjectDoesNotExist as e:
                self.stderr.write(
                    self.style.ERROR(
                        f"Could not find object for lookup {lookup_params}: {e}"
                    )
                )
                continue

            for key, value in item_data.items():
                if key in unique_fields or key == "category_slug":
                    continue

                field_name = key.replace("_slug", "").replace("_slugs", "")

                try:
                    model_field = model._meta.get_field(field_name)
                except FieldDoesNotExist:
                    continue

                if model_field.many_to_many:
                    m2m_data[field_name] = value
                elif model_field.many_to_one:
                    try:
                        related_obj = model_field.related_model.objects.get(slug=value)
                        defaults[field_name] = related_obj
                    except ObjectDoesNotExist:
                        self.stderr.write(
                            self.style.ERROR(
                                f"Could not find related object for {field_name} with slug {value}"
                            )
                        )
                        continue
                else:
                    defaults[key] = value

            obj, created = model.objects.update_or_create(
                **lookup_params, defaults=defaults
            )

            if m2m_data:
                for field_name, slugs in m2m_data.items():
                    m2m_field = getattr(obj, field_name)
                    RelatedModel = m2m_field.model
                    related_objects = RelatedModel.objects.filter(slug__in=slugs)
                    m2m_field.set(related_objects)

            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"Created {model.__name__} instance: {obj}")
                )

        self.stdout.write(self.style.SUCCESS("Data import complete."))
