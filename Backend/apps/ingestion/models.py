"""
Ingestion application models.

This module defines models for raw data ingestion and tracking:
- RawRecord: The original uploaded data, unchanged
- Stores source-specific metadata
"""

import json
from django.db import models
from apps.core.models import UUIDMixin, TimestampedMixin, TenantMixin, DataSource


class RawRecord(UUIDMixin, TimestampedMixin, TenantMixin, models.Model):
    """
    Original uploaded data, before any transformation.
    
    Why keep raw data?
    1. Audit trail: Can regenerate normalized records if parsing rules change
    2. Debugging: Can see exactly what was uploaded vs what was parsed
    3. Compliance: Original data is immutable, proving source integrity
    4. Re-processing: Can re-parse old uploads with improved parsers
    
    Attributes:
        data_source: Which source this record came from
        raw_data: Original row as dict/JSON
        file_name: Name of uploaded CSV file
        row_number: Which row in the file
        processing_status: Stage of pipeline (UPLOADED, PROCESSING, SUCCESS, FAILED)
        error_message: If FAILED, what went wrong
        normalized_record: FK to NormalizedEmissionRecord (if created)
    """
    
    PROCESSING_STATUS_CHOICES = [
        ('UPLOADED', 'Uploaded, awaiting processing'),
        ('PROCESSING', 'Currently being processed'),
        ('SUCCESS', 'Successfully normalized'),
        ('FAILED', 'Failed during processing'),
    ]
    
    data_source = models.ForeignKey(
        DataSource,
        on_delete=models.CASCADE,
        related_name='raw_records',
        help_text='Which source this record came from'
    )
    raw_data = models.JSONField(
    default=dict,
    blank=True,
    null=True
)
    file_name = models.CharField(
        max_length=255,
        help_text='Name of uploaded CSV file'
    )
    row_number = models.PositiveIntegerField(
        help_text='Which row in the CSV (1-indexed)'
    )
    processing_status = models.CharField(
        max_length=20,
        choices=PROCESSING_STATUS_CHOICES,
        default='UPLOADED',
        db_index=True,
        help_text='Current stage in processing pipeline'
    )
    error_message = models.TextField(
        blank=True,
        help_text='If FAILED, describes what went wrong'
    )
    
    class Meta:
        ordering = ['-created_at']
        unique_together = [('data_source', 'file_name', 'row_number')]
        indexes = [
            models.Index(fields=['company', 'processing_status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['data_source', 'processing_status']),
        ]
    
    def __str__(self):
        return f"RawRecord: {self.data_source.name} row {self.row_number}"
    
    def mark_processing(self):
        """Update status to PROCESSING."""
        self.processing_status = 'PROCESSING'
        self.save(update_fields=['processing_status'])
    
    def mark_success(self):
        """Update status to SUCCESS."""
        self.processing_status = 'SUCCESS'
        self.error_message = ''
        self.save(update_fields=['processing_status', 'error_message'])
    
    def mark_failed(self, error_msg):
        """Update status to FAILED with error message."""
        self.processing_status = 'FAILED'
        self.error_message = error_msg
        self.save(update_fields=['processing_status', 'error_message'])
