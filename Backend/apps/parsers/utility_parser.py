"""
Utility electricity data parser.

Handles CSV exports from utility company portals:
- Meter readings (kWh)
- Billing periods
- Tariff types
- Provider information

Real utility exports are challenging:
- Non-calendar billing periods (mid-read to mid-read)
- Missing consumption values
- Unit variations (kWh, MWh, GJ)
- Regional differences (German vs UK vs US formats)
"""

from decimal import Decimal
from apps.parsers.base_parser import BaseParser, ValidationError


class UtilityParser(BaseParser):
    """
    Parser for utility company electricity portal exports.
    
    Expected columns:
    - MeterID: Meter identifier (e.g., METER_001, 123456789)
    - FacilityName: Building/facility name (optional)
    - Consumption: Energy consumed
    - Unit: Unit of measure (kWh, MWh, etc.)
    - BillingStart: Period start date
    - BillingEnd: Period end date
    - TariffType: COMMERCIAL, INDUSTRIAL, RESIDENTIAL
    - Provider: Utility company name
    """
    
    SOURCE_TYPE = 'ELECTRICITY'
    
    REQUIRED_FIELDS = ['meterid', 'consumption', 'unit', 'billingstart', 'billingend']
    
    UNIT_CONVERSIONS = {
        'kwh': 1.0,
        'mwh': 1000,  # 1 MWh = 1000 kWh
        'wh': 0.001,  # 1 Wh = 0.001 kWh
        'gj': 277.78,  # 1 GJ ≈ 278 kWh (approximate)
    }
    
    TARIFF_TYPES = ['COMMERCIAL', 'INDUSTRIAL', 'RESIDENTIAL', 'OTHER']
    
    def _parse_impl(self, row_dict: dict) -> dict:
        """Parse utility meter reading."""
        
        # Normalize header names
        normalized_row = self._normalize_headers(row_dict)
        
        # Extract meter ID
        meter_id = self.validate_string(
            normalized_row.get('meterid', ''),
            'MeterID',
            max_length=50
        )
        meter_id = self.standardize_facility_code(meter_id)
        
        # Facility name (optional)
        facility_name = normalized_row.get('facilityname', '')
        facility_name = self.standardize_vendor_name(facility_name) if facility_name else ''
        
        # Extract and standardize consumption
        consumption_raw = self.validate_positive_number(
            normalized_row.get('consumption', ''),
            'Consumption'
        )
        
        # Extract unit and convert to kWh
        unit_raw = self.validate_string(
            normalized_row.get('unit', 'kWh'),
            'Unit',
            max_length=20
        )
        
        consumption_kwh = self._convert_to_kwh(
            float(consumption_raw),
            unit_raw.lower()
        )
        
        # Extract billing period dates
        billing_start = self.validate_date(
            normalized_row.get('billingstart', ''),
            'BillingStart'
        )
        
        billing_end = self.validate_date(
            normalized_row.get('billingend', ''),
            'BillingEnd'
        )
        
        # Validate that end date >= start date
        if billing_end < billing_start:
            raise ValidationError(
                f"BillingEnd ({billing_end}) cannot be before BillingStart ({billing_start})"
            )
        
        # Tariff type (optional)
        tariff_type = normalized_row.get('tarifftype', 'OTHER')
        if tariff_type:
            try:
                tariff_type = self.validate_choice(
                    tariff_type,
                    self.TARIFF_TYPES,
                    'TariffType'
                )
            except ValidationError:
                tariff_type = 'OTHER'
        else:
            tariff_type = 'OTHER'
        
        # Provider (optional)
        provider = self.standardize_vendor_name(
            normalized_row.get('provider', '')
        )
        
        # Check for anomalies
        anomalies = self.check_anomalies({
            'quantity': consumption_kwh,
            'date': billing_start,
        })
        
        # Additional checks
        if consumption_kwh == 0:
            anomalies['zero_consumption'] = 'Meter reading is zero (meter may not be active)'
        
        if consumption_kwh > 1000000:  # 1,000,000 kWh per month = huge
            anomalies['unusually_high'] = (
                f'Consumption {consumption_kwh} kWh is unusually high '
                '(>99th percentile). Verify unit conversion.'
            )
        
        return {
            'source_type': self.SOURCE_TYPE,
            'scope': 2,  # Scope 2: Purchased electricity
            'category': 'electricity_grid',
            'facility_code': meter_id,
            'facility_name': facility_name,
            'quantity': float(consumption_raw),
            'unit': unit_raw,
            'quantity_standardized': float(consumption_kwh),
            'date': billing_start,  # Use billing start as record date
            'vendor': provider,
            'document_type': 'ELECTRICITY',
            'tariff_type': tariff_type,
            'billing_period': f'{billing_start} to {billing_end}',
            'anomalies': anomalies,
            'notes': f'Electricity consumption. Billing period: {billing_start} to {billing_end}. Tariff: {tariff_type}',
        }
    
    def _normalize_headers(self, row_dict: dict) -> dict:
        """Normalize header names to canonical form."""
        header_map = {
            'meterid': ['meterid', 'meter_id', 'meter', 'metrid', 'account_number'],
            'facilityname': ['facilityname', 'facility_name', 'building', 'location', 'name'],
            'consumption': ['consumption', 'usage', 'kwh', 'energy', 'amount'],
            'unit': ['unit', 'uom', 'unitofmeasure', 'measure'],
            'billingstart': ['billingstart', 'billing_start', 'startdate', 'start_date', 'periodstart'],
            'billingend': ['billingend', 'billing_end', 'enddate', 'end_date', 'periodend'],
            'tarifftype': ['tarifftype', 'tariff_type', 'tariff', 'rate_type'],
            'provider': ['provider', 'utility', 'company', 'supplier'],
        }
        
        normalized = {}
        for key, value in row_dict.items():
            key_lower = key.strip().lower()
            
            canonical = None
            for canonical_name, aliases in header_map.items():
                if any(alias == key_lower for alias in aliases):
                    canonical = canonical_name
                    break
            
            if canonical:
                normalized[canonical] = value
            else:
                normalized[key_lower] = value
        
        return normalized
    
    def _convert_to_kwh(self, value: float, unit_raw: str) -> float:
        """
        Convert energy value to kWh.
        
        Args:
            value: Numeric value
            unit_raw: Unit string (kWh, MWh, GJ, etc.)
        
        Returns:
            Value in kWh
        
        Raises:
            ValidationError if unit not recognized
        """
        unit_norm = unit_raw.lower().strip()
        
        # Direct match
        if unit_norm in self.UNIT_CONVERSIONS:
            factor = self.UNIT_CONVERSIONS[unit_norm]
            return value * factor
        
        # Try partial matches
        for canonical, aliases in [
            ('kwh', ['kwh', 'kwhour', 'kilowatthour']),
            ('mwh', ['mwh', 'megawatt']),
            ('gj', ['gj', 'gigajoule']),
        ]:
            if any(alias in unit_norm for alias in aliases):
                if canonical in self.UNIT_CONVERSIONS:
                    return value * self.UNIT_CONVERSIONS[canonical]
        
        # Unknown unit
        raise ValidationError(
            f"Unit '{unit_raw}' not recognized. Supported: kWh, MWh, GJ"
        )
