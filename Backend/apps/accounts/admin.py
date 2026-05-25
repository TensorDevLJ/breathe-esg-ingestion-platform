# """Admin interface for accounts app."""
# from django.contrib import admin
# from apps.accounts.models import Company, User


# @admin.register(Company)
# class CompanyAdmin(admin.ModelAdmin):
#     list_display = ('name', 'is_active', 'created_at')
#     search_fields = ('name',)
#     list_filter = ('is_active', 'created_at')
#     readonly_fields = ('id', 'created_at', 'updated_at')


# @admin.register(User)
# class UserAdmin(admin.ModelAdmin):
#     list_display = ('email', 'company', 'role', 'is_active')
#     search_fields = ('email', 'first_name', 'last_name')
#     list_filter = ('role', 'is_active', 'company')
#     readonly_fields = ('id', 'created_at', 'updated_at')



from django.contrib import admin
from .models import Company, User

admin.site.register(Company)
admin.site.register(User)