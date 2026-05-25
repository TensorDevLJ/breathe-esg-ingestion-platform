"""Admin interface for normalization app."""
from django.contrib import admin
from apps.normalization.models import (
    NormalizedEmissionRecord, ReviewQueue, AuditLog, PlantLookup
)


@admin.register(NormalizedEmissionRecord)
class NormalizedRecordAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'facility_code', 'source_type', 'scope',
        'is_flagged', 'is_locked', 'created_at'
    )
    search_fields = ('facility_code', 'facility_name')
    list_filter = ('source_type', 'scope', 'is_flagged', 'is_locked', 'created_at')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(ReviewQueue)
class ReviewQueueAdmin(admin.ModelAdmin):
    list_display = ('id', 'status', 'severity', 'reviewed_by', 'created_at')
    search_fields = ('reason_flagged',)
    list_filter = ('status', 'severity', 'created_at')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'action', 'actor', 'created_at')
    search_fields = ('record__id',)
    list_filter = ('action', 'actor', 'created_at')
    readonly_fields = ('id', 'created_at', 'changes')


@admin.register(PlantLookup)
class PlantLookupAdmin(admin.ModelAdmin):
    list_display = ('sap_plant_code', 'facility_name', 'company')
    search_fields = ('sap_plant_code', 'facility_name')
    list_filter = ('company',)
    readonly_fields = ('id', 'created_at', 'updated_at')
