import pandas as pd
from datetime import date

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import RawRecord
from apps.core.models import DataSource
from apps.accounts.models import Company

from apps.normalization.models import (
    NormalizedEmissionRecord,
    ReviewQueue,
    AuditLog
)


@csrf_exempt
def upload_csv(request):

    if request.method != "POST":
        return JsonResponse({
            "error": "POST request required"
        })

    if "file" not in request.FILES:
        return JsonResponse({
            "error": "No file uploaded"
        })

    file = request.FILES["file"]

    try:

        df = pd.read_csv(file)

        # =========================
        # CREATE / GET COMPANY
        # =========================

        company, _ = Company.objects.get_or_create(

            name="Breathe ESG",

            defaults={
                "is_active": True
            }

        )

        # =========================
        # DETECT SOURCE TYPE
        # =========================

        columns = [col.lower() for col in df.columns]

        source_name = "TRAVEL"

        if "meterid" in columns or "consumption" in columns:

            source_name = "ELECTRICITY"

        elif "plantcode" in columns or "material" in columns:

            source_name = "SAP"

        elif "traveltype" in columns or "origin" in columns:

            source_name = "TRAVEL"

        # =========================
        # CREATE / GET DATASOURCE
        # =========================

        datasource, _ = DataSource.objects.get_or_create(

            name=source_name,

            defaults={

                "company": company,

                "is_active": True

            }

        )

        count = 0
        suspicious_count = 0

        # =========================
        # PROCESS ROWS
        # =========================

        for i, row in df.iterrows():

            # =========================
            # GET QUANTITY
            # =========================

            if source_name == "ELECTRICITY":

                quantity = float(
                    row.get("Consumption", 0)
                )

                unit = row.get("Unit", "kWh")

            elif source_name == "SAP":

                quantity = float(
                    row.get("Quantity", 0)
                )

                unit = row.get("Unit", "liters")

            elif source_name == "TRAVEL":

                quantity = float(
                    row.get("Distance", 0)
                )

                unit = row.get("Unit", "km")

            else:

                quantity = 0
                unit = "unknown"

            # =========================
            # FLAG RULE
            # =========================

            if quantity > 3000:

                status = "FAILED"

                suspicious_count += 1

            else:

                status = "SUCCESS"

            # =========================
            # CREATE RAW RECORD
            # =========================

            raw_record, created = RawRecord.objects.get_or_create(

                company=company,

                data_source=datasource,

                file_name=file.name,

                row_number=i + 1,

                defaults={

                    "raw_data": row.to_dict(),

                    "processing_status": status

                }

            )

            # =========================
            # CREATE NORMALIZED RECORD
            # =========================

            if created:

                source = datasource.name.upper()

                # -------------------------
                # FACILITY
                # -------------------------

                facility = "Corporate Travel"

                if source == "SAP":

                    facility = "SAP Operations"

                elif source == "ELECTRICITY":

                    facility = "Bangalore Manufacturing Plant"

                elif source == "TRAVEL":

                    facility = "Corporate Travel"

                # -------------------------
                # SCOPE + CATEGORY
                # -------------------------

                if source == "SAP":

                    scope = 1
                    category = "fuel_other"

                elif source == "ELECTRICITY":

                    scope = 2
                    category = "electricity_grid"

                else:

                    scope = 3
                    category = "travel_ground"

                # =========================
                # CREATE NORMALIZED ENTRY
                # =========================

                record = NormalizedEmissionRecord.objects.create(

                    company=company,

                    raw_record=raw_record,

                    source_type=source,

                    scope=scope,

                    category=category,

                    facility_code=f"REC{i+1}",

                    facility_name=facility,

                    quantity=quantity,

                    unit=unit,

                    quantity_standardized=quantity * 0.25,

                    date=date.today(),

                    is_flagged=(quantity > 3000),

                    flag_reason={

                        "suspicious":
                        "high quantity"

                    } if quantity > 3000 else {}

                )

                # =========================
                # REVIEW QUEUE
                # =========================

                if quantity > 3000:

                    ReviewQueue.objects.create(

                        company=company,

                        normalized_record=record,

                        reason_flagged="Suspicious high quantity",

                        severity="HIGH",

                        status="PENDING"

                    )

                # =========================
                # AUDIT LOG
                # =========================

                AuditLog.objects.create(

                    company=company,

                    record=record,

                    action="CREATED"

                )

            count += 1

        # =========================
        # SUCCESS RESPONSE
        # =========================

        return JsonResponse({

            "message": "Uploaded Successfully",

            "records_imported": count,

            "suspicious_records": suspicious_count

        })

    except Exception as e:

        return JsonResponse({

            "error": str(e)

        })


# =========================================
# DASHBOARD STATS
# =========================================

def dashboard_stats(request):

    total = NormalizedEmissionRecord.objects.count()

    flagged = NormalizedEmissionRecord.objects.filter(
        is_flagged=True
    ).count()

    approved = NormalizedEmissionRecord.objects.filter(
        is_flagged=False
    ).count()

    pending = ReviewQueue.objects.filter(
        status="PENDING"
    ).count()

    by_source = {}
    by_scope = {}

    for item in (

        NormalizedEmissionRecord.objects
        .values_list("source_type")

    ):

        source = item[0]

        by_source[source] = (

            by_source.get(source, 0) + 1

        )

    for item in (

        NormalizedEmissionRecord.objects
        .values_list("scope")

    ):

        scope = str(item[0])

        by_scope[scope] = (

            by_scope.get(scope, 0) + 1

        )

    return JsonResponse({

        "total_records": total,

        "flagged_count": flagged,

        "approved_count": approved,

        "pending_count": pending,

        "by_source": by_source,

        "by_scope": by_scope,

        "by_status": {

            "approved": approved,

            "flagged": flagged

        }

    })


# =========================================
# RECORDS LIST
# =========================================

def records_list(request):

    records = NormalizedEmissionRecord.objects.all()

    data = []

    for record in records:

        data.append({

            "id": str(record.id),

            "facility_name":
            record.facility_name,

            "facility_code":
            record.facility_code,

            "source_type":
            record.source_type,

            "quantity":
            record.quantity,

            "unit":
            record.unit,

            "date":
            record.date,

            "is_flagged":
            record.is_flagged

        })

    return JsonResponse({

        "results": data

    })


# =========================================
# REVIEW QUEUE
# =========================================

def review_queue(request):

    items = ReviewQueue.objects.filter(
        status="PENDING"
    )

    data = []

    for item in items:

        record = item.normalized_record

        data.append({

            "id": str(item.id),

            "severity":
            item.severity,

            "reason_flagged":
            item.reason_flagged,

            "normalized_record": {

                "id":
                str(record.id),

                "facility_name":
                record.facility_name,

                "source_type":
                record.source_type,

                "quantity":
                record.quantity,

                "unit":
                record.unit,

                "date":
                record.date

            }

        })

    return JsonResponse({

        "results": data

    })


# =========================================
# APPROVE REVIEW
# =========================================

@csrf_exempt
def approve_review(request, id):

    item = ReviewQueue.objects.get(
        id=id
    )

    item.status = "APPROVED"

    item.save()

    AuditLog.objects.create(

        company=item.company,

        record=item.normalized_record,

        action="APPROVED"

    )

    return JsonResponse({

        "message": "approved"

    })


# =========================================
# REJECT REVIEW
# =========================================

@csrf_exempt
def reject_review(request, id):

    item = ReviewQueue.objects.get(
        id=id
    )

    item.status = "REJECTED"

    item.save()

    AuditLog.objects.create(

        company=item.company,

        record=item.normalized_record,

        action="REJECTED"

    )

    return JsonResponse({

        "message": "rejected"

    })


# =========================================
# AUDIT LOGS
# =========================================

def audit_logs(request):

    logs = AuditLog.objects.all().order_by(
        "-created_at"
    )

    data = []

    for log in logs:

        data.append({

            "id": str(log.id),

            "action":
            log.action,

            "created_at":
            log.created_at,

            "record": {

                "id":
                str(log.record.id)

            }

        })

    return JsonResponse({

        "results": data

    })