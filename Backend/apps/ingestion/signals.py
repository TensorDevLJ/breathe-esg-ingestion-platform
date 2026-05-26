from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.ingestion.models import RawRecord
from apps.normalization.models import NormalizedEmissionRecord

@receiver(post_save, sender=RawRecord)
def process_raw_record(sender, instance, created, **kwargs):

    if created:

        data=instance.raw_data

        NormalizedEmissionRecord.objects.create(
            company=instance.company,
            source_type='SAP ERP',
            scope='SCOPE_1',
            category='Fuel - Diesel',
            facility_code=data.get("plant"),
            quantity=data.get("quantity",0),
            unit=data.get("unit","liters")
        )

        instance.mark_success()