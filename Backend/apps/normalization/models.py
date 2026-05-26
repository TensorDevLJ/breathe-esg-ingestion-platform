"""
Normalization application models.

Core models for:
- NormalizedEmissionRecord: Standardized, cleaned data ready for analysis
- ReviewQueue: Analyst review workflow for flagged records
- AuditLog: Complete change history for compliance
- PlantLookup: SAP plant code reference data
"""

import json
from django.db import models
from apps.core.models import UUIDMixin, TimestampedMixin, TenantMixin
from apps.accounts.models import User
from apps.ingestion.models import RawRecord


class NormalizedEmissionRecord(UUIDMixin, TimestampedMixin, TenantMixin, models.Model):
    """
    Standardized, cleaned data record.
    
    This is the single source of truth for analysis. Every field is
    in a consistent format. Quantities are always in kg CO2e.
    
    Why separate from RawRecord?
    - Immutable original data (RawRecord)
    - Computed/standardized data (NormalizedEmissionRecord)
    - Can regenerate normalized if rules change
    - Audit trail preserved
    
    Attributes:
        raw_record: FK to original upload
        source_type: Which source (SAP, ELECTRICITY, TRAVEL)
        scope: Scope 1, 2, or 3 emissions
        category: Detailed category (Fuel, Electricity, Flight, etc.)
        facility_code: SAP plant code or meter ID
        facility_name: Human-readable facility name
        quantity: Amount in original units (for reference)
        unit: Original unit (L, kWh, km, etc.)
        quantity_standardized: Amount in kg CO2e
        date: When this emission occurred
        vendor: Supplier/vendor if applicable
        notes: Additional context
        is_flagged: Whether requires analyst review
        flag_reason: Why flagged (dict of reasons)
        is_locked: Once approved, can't be edited
    """
    
    SOURCE_TYPE_CHOICES = [
        ('SAP', 'SAP ERP'),
        ('ELECTRICITY', 'Utility Electricity'),
        ('TRAVEL', 'Corporate Travel'),
    ]
    
    SCOPE_CHOICES = [
        (1, 'Scope 1 - Direct Emissions'),
        (2, 'Scope 2 - Indirect Emissions (Energy)'),
        (3, 'Scope 3 - Other Indirect Emissions'),
    ]
    
    CATEGORY_CHOICES = [
        # Scope 1
        ('fuel_gasoline', 'Fuel - Gasoline'),
        ('fuel_diesel', 'Fuel - Diesel'),
        ('fuel_natural_gas', 'Fuel - Natural Gas'),
        ('fuel_lpg', 'Fuel - LPG'),
        ('fuel_other', 'Fuel - Other'),
        ('procurement_goods', 'Procurement - Goods'),
        ('procurement_services', 'Procurement - Services'),
        
        # Scope 2
        ('electricity_grid', 'Electricity - Grid'),
        ('steam_heating', 'Steam/Heating'),
        ('steam_cooling', 'Steam/Cooling'),
        
        # Scope 3
        ('travel_flight', 'Travel - Flight'),
        ('travel_hotel', 'Travel - Hotel'),
        ('travel_ground', 'Travel - Ground Transport'),
        ('commuting', 'Employee Commuting'),
        ('waste', 'Waste'),
    ]
    
    raw_record = models.OneToOneField(
        RawRecord,
        on_delete=models.CASCADE,
        related_name='normalized_record',
        help_text='Original uploaded data'
    )
    source_type = models.CharField(
        max_length=20,
        choices=SOURCE_TYPE_CHOICES,
        help_text='Which source type this came from'
    )
    scope = models.IntegerField(
        choices=SCOPE_CHOICES,
        help_text='GHG Protocol scope classification'
    )
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        help_text='Detailed category for emission factor lookup'
    )
    facility_code = models.CharField(
        max_length=50,
        help_text='SAP plant code, meter ID, or facility identifier'
    )
    facility_name = models.CharField(
        max_length=255,
        blank=True,
        help_text='Human-readable facility name'
    )
    quantity = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        help_text='Amount in original units'
    )
    unit = models.CharField(
        max_length=20,
        help_text='Original unit (L, kWh, km, etc.)'
    )
    quantity_standardized = models.DecimalField(
        max_digits=18,
        decimal_places=4,
        help_text='Amount in kg CO2e (standardized)'
    )
    date = models.DateField(
        db_index=True,
        help_text='When this emission occurred'
    )
    vendor = models.CharField(
        max_length=255,
        blank=True,
        help_text='Supplier/vendor if applicable'
    )
    notes = models.TextField(
        blank=True,
        help_text='Additional context or data quality notes'
    )
    is_flagged = models.BooleanField(
        default=False,
        db_index=True,
        help_text='Whether this record requires analyst review'
    )
    flag_reason = models.JSONField(
        default=dict,
        blank=True,
        help_text='Dict of reasons why flagged: {reason: detail}'
    )
    is_locked = models.BooleanField(
        default=False,
        help_text='Once approved and locked, cannot be edited'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'is_flagged']),
            models.Index(fields=['company', 'date']),
            models.Index(fields=['company', 'scope']),
            models.Index(fields=['company', 'facility_code']),
            models.Index(fields=['is_locked']),
        ]
    
    def __str__(self):
        return f"{self.facility_code}: {self.quantity} {self.unit} ({self.date})"
    
    def add_flag(self, reason: str, detail: str = ''):
        """Add a flag reason."""
        if not self.flag_reason:
            self.flag_reason = {}
        self.flag_reason[reason] = detail
        self.is_flagged = True
    
    def clear_flags(self):
        """Clear all flags."""
        self.flag_reason = {}
        self.is_flagged = False


class ReviewQueue(UUIDMixin, TimestampedMixin, TenantMixin, models.Model):
    """
    Analyst review workflow for flagged records.
    
    When a record is flagged during ingestion, a ReviewQueue entry
    is created. Analysts see a dashboard of pending items and can
    approve or reject each one.
    
    Attributes:
        normalized_record: The record needing review
        reason_flagged: Why it was flagged (from anomaly detection)
        severity: How concerning (LOW, MEDIUM, HIGH)
        status: Current review status
        reviewed_by: User who reviewed it (if not pending)
        reviewed_at: When they reviewed it
        reviewer_notes: Their comments
    """
    
    SEVERITY_CHOICES = [
        ('LOW', 'Low - Minor issue'),
        ('MEDIUM', 'Medium - Data quality concern'),
        ('HIGH', 'High - Requires clarification'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Awaiting Review'),
        ('APPROVED', 'Approved by Analyst'),
        ('REJECTED', 'Rejected - Will Not Use'),
    ]
    
    normalized_record = models.OneToOneField(
    NormalizedEmissionRecord,
    on_delete=models.CASCADE,
    related_name='review_queue_item',
    null=True,
    blank=True,
    help_text='Record requiring review'
)
    reason_flagged = models.CharField(
        max_length=255,
        help_text='Summary of why flagged'
    )
    severity = models.CharField(
        max_length=20,
        choices=SEVERITY_CHOICES,
        default='MEDIUM',
        help_text='How urgent is this review'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',
        db_index=True,
        help_text='Current approval status'
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_items',
        help_text='Who approved/rejected this'
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When was it reviewed'
    )
    reviewer_notes = models.TextField(
        blank=True,
        help_text='Analyst comments and reasoning'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'status']),
            models.Index(fields=['company', 'severity']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"Review {self.id}: {self.get_status_display()}"
    
    def approve(self, user: User, notes: str = ''):
        """Approve this record."""
        self.status = 'APPROVED'
        self.reviewed_by = user
        self.reviewer_notes = notes
        from django.utils import timezone
        self.reviewed_at = timezone.now()
        self.save()
        
        # Lock the normalized record
        self.normalized_record.is_locked = True
        self.normalized_record.save(update_fields=['is_locked'])
    
    def reject(self, user: User, notes: str = ''):
        """Reject this record."""
        self.status = 'REJECTED'
        self.reviewed_by = user
        self.reviewer_notes = notes
        from django.utils import timezone
        self.reviewed_at = timezone.now()
        self.save()


class AuditLog(UUIDMixin, TimestampedMixin, TenantMixin, models.Model):
    """
    Complete change history for compliance.
    
    Every action on a NormalizedEmissionRecord is logged:
    - Created
    - Approved/Rejected
    - Edited (if not locked)
    
    This is the source of truth for "what happened when."
    
    Attributes:
        record: Which record was changed
        action: What action (CREATED, APPROVED, REJECTED, EDITED)
        actor: Who did it (User)
        changes: Dict of field changes {field: {old, new}}
        timestamp: When (auto-set to now)
        ip_address: For security tracking
    """
    
    ACTION_CHOICES = [
        ('CREATED', 'Record Created'),
        ('APPROVED', 'Record Approved'),
        ('REJECTED', 'Record Rejected'),
        ('EDITED', 'Record Modified'),
        ('LOCKED', 'Record Locked'),
    ]
    
    record = models.ForeignKey(
        NormalizedEmissionRecord,
        on_delete=models.CASCADE,
        related_name='audit_logs',
        help_text='Which record was changed'
    )
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        help_text='What action was taken'
    )
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='actions_performed',
        help_text='Who performed the action'
    )
    changes = models.JSONField(
        default=dict,
        blank=True,
        help_text='Dict of changes: {field: {old_value, new_value}}'
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='IP address of request'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['record', '-created_at']),
            models.Index(fields=['company', 'action']),
            models.Index(fields=['actor']),
        ]
    
    def __str__(self):
        return f"{self.get_action_display()} by {self.actor} at {self.created_at}"


class PlantLookup(UUIDMixin, TimestampedMixin, TenantMixin, models.Model):
    """
    SAP plant code reference data.
    
    Maps SAP plant codes to human-readable facility names and metadata.
    This is used during normalization to enrich records with facility
    information.
    
    Can be loaded from SAP export or maintained manually.
    
    Attributes:
        sap_plant_code: The code from SAP (e.g., PL001)
        facility_name: Human-readable name
        facility_address: Optional address
        latitude/longitude: Optional geo data
        scope_*_applicable: Which GHG scopes apply to this facility
    """
    
    sap_plant_code = models.CharField(
        max_length=50,
        help_text='Code from SAP (e.g., PL001, FA_BERLIN)'
    )
    facility_name = models.CharField(
        max_length=255,
        help_text='Human-readable facility name'
    )
    facility_address = models.CharField(
        max_length=500,
        blank=True,
        help_text='Street address'
    )
    latitude = models.FloatField(
        null=True,
        blank=True,
        help_text='Geographic latitude'
    )
    longitude = models.FloatField(
        null=True,
        blank=True,
        help_text='Geographic longitude'
    )
    scope_1_applicable = models.BooleanField(
        default=True,
        help_text='Does this facility have Scope 1 emissions?'
    )
    scope_2_applicable = models.BooleanField(
        default=True,
        help_text='Does this facility have Scope 2 emissions?'
    )
    scope_3_applicable = models.BooleanField(
        default=True,
        help_text='Does this facility have Scope 3 emissions?'
    )
    
    class Meta:
        ordering = ['facility_name']
        unique_together = [('company', 'sap_plant_code')]
        indexes = [
            models.Index(fields=['company', 'sap_plant_code']),
            models.Index(fields=['facility_name']),
        ]
    
    def __str__(self):
        return f"{self.sap_plant_code}: {self.facility_name}"
