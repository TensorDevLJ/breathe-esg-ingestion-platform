"""
Core models and mixins for the Breathe ESG application.

This module provides base model classes and mixins that are used across
all applications to ensure consistency in timestamps, audit trails, and
multi-tenancy support.
"""

import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone


# ============================================================================
# MANAGERS
# ============================================================================

class CustomUserManager(BaseUserManager):
    """
    Custom user manager for User model.
    
    Handles both email and username for authentication.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user."""
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


# ============================================================================
# MIXINS
# ============================================================================

class TimestampedMixin(models.Model):
    """
    Mixin that adds created_at and updated_at timestamps to models.
    
    Auto-updates updated_at on every save. These are crucial for:
    - Audit trails
    - Sorting by recency
    - Soft delete implementations (if needed)
    """
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    
    class Meta:
        abstract = True


class UUIDMixin(models.Model):
    """
    Mixin that adds UUID primary key to models.
    
    Why UUID instead of integer ID?
    - Multi-tenant isolation: harder to guess IDs across companies
    - Global uniqueness: no conflicts across services/databases
    - Privacy: numeric IDs reveal ordering/volume
    
    Trade-off: Slightly larger storage, but negligible for this scale
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    class Meta:
        abstract = True


class TenantMixin(models.Model):

    company = models.ForeignKey(
        'accounts.Company',
        on_delete=models.CASCADE,
        help_text='Company that owns this record'
    )

    class Meta:
        abstract = True


# # ============================================================================
# # CORE MODELS
# # ============================================================================

# # # class Company(UUIDMixin, TimestampedMixin, models.Model):
#     """
#     Top-level organization in the system.
    
#     Every User, DataSource, and Record belongs to exactly one Company.
#     This is the basis of multi-tenancy.
    
#     Attributes:
#         id: UUID primary key
#         name: Human-readable company name
#         email_domain: Optional, for auto-assignment of users
#         is_active: Soft delete flag
#         created_by: User who created company (optional)
#     """
    
#     name = models.CharField(
#         max_length=255,
#         unique=True,
#         help_text='Legal entity name or trading name'
#     )
#     email_domain = models.CharField(
#         max_length=255,
#         blank=True,
#         help_text='Email domain for auto-assignment (e.g., acme.com)'
#     )
#     is_active = models.BooleanField(
#         default=True,
#         help_text='Soft delete flag. Set to False to deactivate.'
#     )
#     created_by = models.ForeignKey(
#         'User',
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name='companies_created',
#         help_text='User who created this company'
#     )
    
#     class Meta:
#         ordering = ['-created_at']
#         indexes = [
#             models.Index(fields=['name']),
#             models.Index(fields=['is_active']),
#         ]
    
#     def __str__(self):
#         return f"{self.name} ({'active' if self.is_active else 'inactive'})"


# # class User(AbstractBaseUser, PermissionsMixin, UUIDMixin, TimestampedMixin, models.Model):
#     """
#     Custom user model supporting multi-tenancy.
    
#     Users belong to exactly one Company. A user can be:
#     - ADMIN: Full access, can manage other users
#     - ANALYST: Can upload data and approve records
#     - VIEWER: Read-only access
    
#     Why custom user model?
#     - Support UUID primary key
#     - Add company field
#     - Add role-based access control
#     - Add tenant isolation
#     """
    
#     ROLE_CHOICES = [
#         ('ADMIN', 'Administrator'),
#         ('ANALYST', 'Data Analyst'),
#         ('VIEWER', 'Viewer Only'),
#     ]
    
#     email = models.EmailField(unique=True)
#     first_name = models.CharField(max_length=150, blank=True)
#     last_name = models.CharField(max_length=150, blank=True)
#     company = models.ForeignKey(
#         Company,
#         on_delete=models.CASCADE,
#         related_name='users',
#         help_text='Company this user belongs to'
#     )
#     role = models.CharField(
#         max_length=20,
#         choices=ROLE_CHOICES,
#         default='ANALYST',
#         help_text='Role determines what actions user can perform'
#     )
#     is_staff = models.BooleanField(default=False)
#     is_active = models.BooleanField(default=True)
    
#     objects = CustomUserManager()
    
#     USERNAME_FIELD = 'email'
#     REQUIRED_FIELDS = []
    
#     class Meta:
#         ordering = ['-created_at']
#         unique_together = [('email', 'company')]
#         indexes = [
#             models.Index(fields=['email']),
#             models.Index(fields=['company']),
#             models.Index(fields=['role']),
#         ]
    
#     def __str__(self):
#         return f"{self.email} ({self.get_role_display()})"
    
#     @property
#     def full_name(self):
#         """Return user's full name or email if not provided."""
#         if self.first_name and self.last_name:
#             return f"{self.first_name} {self.last_name}"
#         elif self.first_name:
#             return self.first_name
#         return self.email


# ============================================================================
# SOURCE DATA MODEL
# ============================================================================

class DataSource(UUIDMixin, TimestampedMixin, TenantMixin, models.Model):
    """
    Metadata about an external data source.
    
    Examples:
    - "SAP ERP Production Export"
    - "Building C Electricity Meter"
    - "Corporate Travel Platform (Monthly)"
    
    Attributes:
        source_type: One of SAP, ELECTRICITY, TRAVEL (from constants)
        name: Human-readable name for this source
        description: Notes about data quality, frequency, etc.
        last_sync: When data was last uploaded
        is_active: Whether to accept uploads from this source
    """
    
    SOURCE_TYPES = [
        ('SAP', 'SAP ERP Export'),
        ('ELECTRICITY', 'Utility Electricity Portal'),
        ('TRAVEL', 'Corporate Travel Platform'),
    ]
    
    source_type = models.CharField(
        max_length=20,
        choices=SOURCE_TYPES,
        help_text='Type of data source. Determines parsing strategy.'
    )
    name = models.CharField(
        max_length=255,
        help_text='e.g., "SAP Production Instance", "Grid Building C"'
    )
    description = models.TextField(
        blank=True,
        help_text='Notes about data quality, frequency, contacts'
    )
    last_sync = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When data was last successfully ingested'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='If False, uploads from this source are rejected'
    )
    
    class Meta:
        ordering = ['-created_at']
        unique_together = [('company', 'source_type', 'name')]
        indexes = [
            models.Index(fields=['company', 'source_type']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.get_source_type_display()} - {self.name}"
    
    def mark_synced(self):
        """Update last_sync to now."""
        self.last_sync = timezone.now()
        self.save(update_fields=['last_sync'])
