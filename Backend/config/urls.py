"""
URL routing for Breathe ESG.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers

router = routers.DefaultRouter()

# TODO: Register viewsets here
# from apps.ingestion.views import UploadViewSet
# router.register(r'records', RecordViewSet)
# etc.

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/', include('rest_framework.urls')),
]
