from django.urls import path

from .views import(
    upload_csv,
    dashboard_stats,
    records_list,
    review_queue,
    approve_review,
    reject_review,
    audit_logs
)

urlpatterns=[

    path(
        "upload/",
        upload_csv
    ),

    path(
        "dashboard/",
        dashboard_stats
    ),

    path(
        "records/",
        records_list
    ),

    path(
        "review-queue/",
        review_queue
    ),

    path(
        "review-queue/<str:id>/approve/",
        approve_review
    ),

    path(
        "review-queue/<str:id>/reject/",
        reject_review
    ),

    path(
        "audit-log/",
        audit_logs
    ),

    path(
        "audit-log/export/",
        audit_logs
    )

]