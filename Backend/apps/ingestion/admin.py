"""Admin interface for ingestion app."""
from django.contrib import admin
from apps.ingestion.models import RawRecord
from apps.core.models import DataSource


@admin.register(DataSource)
class DataSourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'source_type', 'company', 'is_active', 'last_sync')
    search_fields = ('name',)
    list_filter = ('source_type', 'is_active')
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_sync')


@admin.register(RawRecord)
class RawRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'data_source', 'row_number', 'processing_status', 'created_at')
    search_fields = ('file_name',)
    list_filter = ('processing_status', 'data_source', 'created_at')
    readonly_fields = ('id', 'created_at', 'updated_at', 'raw_data')
