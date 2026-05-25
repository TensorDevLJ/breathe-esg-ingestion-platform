"""
SAP ERP data parser.

Handles CSV exports from SAP containing:
- Fuel consumption (Scope 1)
- Procurement data (Scope 3)
- Plant codes needing lookup

Real SAP exports are messy:
- Optional German headers
- Multiple date formats
- Plant codes without context
- Inconsistent unit names
- Missing values in some rows

This parser handles the common cases.
"""

from decimal import Decimal
from apps.parsers.base_parser import BaseParser, ValidationError


class SAPParser(BaseParser):
    """
    Parser for SAP ERP CSV exports.
    
    Expected columns (English):
    - PlantCode: SAP plant identifier (e.g., PL001, FA_BERLIN)
    - Material: Material description
    - MaterialCode: Optional material number
    - Quantity: Amount
    - Unit: Unit of measure (L, kg, m³, etc.)
    - Date: Date of transaction
    - DocumentType: FUEL, PROCUREMENT, etc.
    - Vendor: Supplier name
    
    German headers (common):
    - Werkstatt, Werkstättenkode -> Plant Code
    - Material -> Material
    - Menge -> Quantity
    - Einheit -> Unit
    - Datum -> Date
    - Dokumenttyp -> Document Type
    - Lieferant -> Vendor
    """
    
    SOURCE_TYPE = 'SAP'
    
    # Maps both English and German headers
    HEADER_ALIASES = {
        'plantcode': ['plantcode', 'plant_code', 'plant', 'werkstatt', 'werkstättenkode', 'werk'],
        'material': ['material', 'materialname', 'material_description', 'materialbeschreibung'],
        'quantity': ['quantity', 'qty', 'menge', 'amount'],
        'unit': ['unit', 'uom', 'einheit', 'masseinheit'],
        'date': ['date', 'datum', 'transaction_date', 'transactiondate'],
        'document_type': ['documenttype', 'document_type', 'dokumenttyp', 'type', 'typ'],
        'vendor': ['vendor', 'supplier', 'lieferant'],
        'material_code': ['materialcode', 'material_code', 'materialnr'],
    }
    
    REQUIRED_FIELDS = ['plantcode', 'quantity', 'unit', 'date', 'document_type']
    
    FUEL_TYPES = ['fuel', 'petrol', 'gasoline', 'diesel', 'natural_gas', 'lpg', 'heating_oil']
    PROCUREMENT_TYPES = ['procurement', 'material', 'goods', 'services']
    
    def _parse_impl(self, row_dict: dict) -> dict:
        """Parse SAP export row."""
        
        # Normalize header names (handle English and German)
        normalized_row = self._normalize_headers(row_dict)
        
        # Extract fields with validation
        plant_code = self.validate_string(
            normalized_row.get('plantcode', ''),
            'PlantCode',
            max_length=50
        )
        plant_code = self.standardize_facility_code(plant_code)
        
        material = self.validate_string(
            normalized_row.get('material', ''),
            'Material',
            max_length=255
        )
        
        quantity = self.validate_positive_number(
            normalized_row.get('quantity', ''),
            'Quantity'
        )
        
        unit = self.validate_string(
            normalized_row.get('unit', ''),
            'Unit',
            max_length=20
        )
        unit = self.standardize_unit(unit)
        
        date = self.validate_date(
            normalized_row.get('date', ''),
            'Date'
        )
        
        document_type = self.validate_choice(
            normalized_row.get('document_type', 'FUEL'),
            self.FUEL_TYPES + self.PROCUREMENT_TYPES,
            'DocumentType'
        )
        
        vendor = self.standardize_vendor_name(
            normalized_row.get('vendor', '')
        )
        
        # Determine scope and category based on document type
        doc_type_upper = document_type.upper()
        
        if any(ft in doc_type_upper for ft in self.FUEL_TYPES):
            scope = 1
            category = 'fuel_other'  # Will be refined by material name
            
            # Try to infer fuel type from material name
            material_lower = material.lower()
            if 'diesel' in material_lower:
                category = 'fuel_diesel'
            elif 'gasoline' in material_lower or 'petrol' in material_lower:
                category = 'fuel_gasoline'
            elif 'natural_gas' in material_lower or 'gas' in material_lower:
                category = 'fuel_natural_gas'
            elif 'lpg' in material_lower:
                category = 'fuel_lpg'
        else:
            scope = 3
            category = 'procurement_goods' if 'goods' in doc_type_upper else 'procurement_services'
        
        # Check for anomalies
        anomalies = self.check_anomalies({
            'quantity': quantity,
            'date': date,
        })
        
        return {
            'source_type': self.SOURCE_TYPE,
            'scope': scope,
            'category': category,
            'facility_code': plant_code,
            'material': material,
            'quantity': float(quantity),
            'unit': unit,
            'date': date,
            'vendor': vendor,
            'document_type': document_type,
            'anomalies': anomalies,
            'notes': f'SAP material: {material}',
        }
    
    def _normalize_headers(self, row_dict: dict) -> dict:
        """
        Convert mixed English/German headers to canonical form.
        
        Examples:
        - "Werkstatt" -> "plantcode"
        - "Menge" -> "quantity"
        - "Einheit" -> "unit"
        """
        normalized = {}
        
        for key, value in row_dict.items():
            key_lower = key.strip().lower()
            
            # Find canonical field name
            canonical = None
            for canonical_name, aliases in self.HEADER_ALIASES.items():
                if any(alias == key_lower for alias in aliases):
                    canonical = canonical_name
                    break
            
            if canonical:
                normalized[canonical] = value
            else:
                # Keep unknown fields as-is
                normalized[key_lower] = value
        
        return normalized
