class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "display_name"]
        read_only_fields = ["email"]

    def validate_display_name(self, value):
        """
        Check that the display name does not contain profanity.
        """
        if profanity.contains_profanity(value):
            raise serializers.ValidationError("Display name contains inappropriate language.")
        return value

    def validate_username(self, value):
        """
        Check that the username is unique and does not contain profanity.
        """
        if User.objects.exclude(pk=self.instance.pk).filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")

        if profanity.contains_profanity(value):
            raise serializers.ValidationError("Display name contains inappropriate language.")
        return value



class CustomPasswordResetSerializer(PasswordResetSerializer):
    def get_email_options(self):
        return {
            'subject_template_name': 'templates/registration/password_reset_subject.txt',
            'email_template_name': 'templates/registration/password_reset_body.txt',
        }



