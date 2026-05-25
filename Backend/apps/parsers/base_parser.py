"""
Base parser class and shared parsing utilities.

This module provides:
1. BaseParser: Abstract class for source-specific parsers
2. Validation utilities
3. Standardization utilities
"""

from abc import ABC, abstractmethod
from datetime import datetime
from decimal import Decimal
import re


class ParsingError(Exception):
    """Custom exception for parsing errors."""
    pass


class ValidationError(Exception):
    """Custom exception for validation errors."""
    pass


class BaseParser(ABC):
    """
    Abstract base class for source-specific parsers.
    
    Subclasses must implement:
    - parse(row_dict) -> dict or raise ValidationError
    
    All parsers follow the same pipeline:
    1. Validate required fields present
    2. Validate data types
    3. Validate value ranges
    4. Standardize formats (dates, units)
    5. Return standardized dict
    
    This ensures consistent, predictable behavior across all sources.
    """
    
    # Subclasses override these
    REQUIRED_FIELDS = []
    SOURCE_TYPE = None  # 'SAP', 'ELECTRICITY', 'TRAVEL'
    
    def parse(self, row_dict: dict) -> dict:
        """
        Parse a row from uploaded data.
        
        Args:
            row_dict: Dictionary representing one CSV row
        
        Returns:
            Dictionary with standardized fields
        
        Raises:
            ValidationError: If validation fails
        """
        # Step 1: Validate required fields
        self._validate_required_fields(row_dict)
        
        # Step 2: Subclass-specific parsing
        parsed = self._parse_impl(row_dict)
        
        # Step 3: Return standardized output
        return parsed
    
    @abstractmethod
    def _parse_impl(self, row_dict: dict) -> dict:
        """
        Subclass implements source-specific parsing.
        
        Should:
        1. Extract relevant fields
        2. Validate data types/ranges
        3. Standardize formats
        4. Return dict with standardized fields
        """
        pass
    
    def _validate_required_fields(self, row_dict: dict):
        """Validate that all required fields are present."""
        missing = []
        for field in self.REQUIRED_FIELDS:
            if field not in row_dict or not str(row_dict[field]).strip():
                missing.append(field)
        
        if missing:
            raise ValidationError(f"Missing required fields: {', '.join(missing)}")
    
    # ========================================================================
    # VALIDATION UTILITIES
    # ========================================================================
    
    @staticmethod
    def validate_positive_number(value, field_name: str) -> Decimal:
        """
        Validate and convert to positive Decimal.
        
        Raises ValidationError if:
        - Not a number
        - Negative or zero
        """
        try:
            decimal_value = Decimal(str(value).strip())
        except:
            raise ValidationError(f"{field_name}: '{value}' is not a valid number")
        
        if decimal_value <= 0:
            raise ValidationError(f"{field_name}: must be positive, got {decimal_value}")
        
        return decimal_value
    
    @staticmethod
    def validate_non_negative_number(value, field_name: str) -> Decimal:
        """Validate and convert to non-negative Decimal."""
        try:
            decimal_value = Decimal(str(value).strip())
        except:
            raise ValidationError(f"{field_name}: '{value}' is not a valid number")
        
        if decimal_value < 0:
            raise ValidationError(f"{field_name}: must be non-negative, got {decimal_value}")
        
        return decimal_value
    
    @staticmethod
    def validate_choice(value, choices: list, field_name: str) -> str:
        """Validate value is in allowed choices."""
        value_str = str(value).strip().upper()
        for choice in choices:
            if value_str == choice.upper():
                return choice
        raise ValidationError(
            f"{field_name}: '{value}' not in allowed values: {', '.join(choices)}"
        )
    
    @staticmethod
    def validate_date(value, field_name: str, format_hint: str = None) -> str:
        """
        Validate and standardize date to ISO format (YYYY-MM-DD).
        
        Tries multiple common date formats:
        - YYYY-MM-DD
        - DD.MM.YYYY (German)
        - DD/MM/YYYY
        - MM/DD/YYYY
        - YYYY-MM-DD HH:MM:SS
        """
        value_str = str(value).strip()
        
        formats_to_try = [
            '%Y-%m-%d',
            '%d.%m.%Y',
            '%d/%m/%Y',
            '%m/%d/%Y',
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d %H:%M',
            '%d.%m.%Y %H:%M:%S',
        ]
        
        for fmt in formats_to_try:
            try:
                dt = datetime.strptime(value_str, fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        raise ValidationError(
            f"{field_name}: '{value}' could not be parsed as date. "
            f"Supported formats: YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY, MM/DD/YYYY"
        )
    
    @staticmethod
    def validate_string(value, field_name: str, max_length: int = None) -> str:
        """Validate and clean string."""
        if not value:
            raise ValidationError(f"{field_name}: cannot be empty")
        
        s = str(value).strip()
        
        if max_length and len(s) > max_length:
            raise ValidationError(
                f"{field_name}: exceeds maximum length of {max_length}"
            )
        
        return s
    
    # ========================================================================
    # STANDARDIZATION UTILITIES
    # ========================================================================
    
    @staticmethod
    def standardize_unit(unit: str, unit_map: dict = None) -> str:
        """
        Standardize unit strings.
        
        Maps variations to canonical form:
        - "L", "l", "liter", "litre" -> "liter"
        - "KWH", "kWh", "kwhours" -> "kWh"
        - etc.
        """
        if not unit_map:
            unit_map = {
                'liter': ['l', 'ltr', 'litre', 'liters', 'litres'],
                'kWh': ['kwh', 'khw', 'kwhours'],
                'kg': ['kilogram', 'kilograms', 'kgs'],
                'km': ['kilometer', 'kilometres', 'kms'],
            }
        
        unit_normalized = unit.strip().lower()
        
        for canonical, variations in unit_map.items():
            if unit_normalized == canonical.lower():
                return canonical
            if unit_normalized in variations:
                return canonical
        
        return unit.strip()
    
    @staticmethod
    def standardize_facility_code(code: str) -> str:
        """
        Standardize facility/plant codes.
        
        Rules:
        - Uppercase
        - Remove leading/trailing whitespace
        - Replace common variations
        """
        code_str = str(code).strip().upper()
        
        # Replace common variations
        code_str = code_str.replace(' ', '_')
        code_str = code_str.replace('-', '_')
        
        return code_str
    
    @staticmethod
    def standardize_vendor_name(vendor: str) -> str:
        """Standardize vendor/supplier names."""
        if not vendor:
            return ''
        return str(vendor).strip().title()
    
    # ========================================================================
    # ANOMALY DETECTION RULES
    # ========================================================================
    
    @staticmethod
    def check_anomalies(parsed_dict: dict) -> dict:
        """
        Check for common anomalies.
        
        Returns dict of {anomaly_type: details} or empty dict if none.
        """
        anomalies = {}
        
        # Missing quantity
        if 'quantity' not in parsed_dict or not parsed_dict['quantity']:
            anomalies['missing_quantity'] = 'Quantity field is empty'
        
        # Missing date
        if 'date' not in parsed_dict or not parsed_dict['date']:
            anomalies['missing_date'] = 'Date field is empty'
        
        # Negative quantity
        if 'quantity' in parsed_dict:
            try:
                if Decimal(str(parsed_dict['quantity'])) < 0:
                    anomalies['negative_quantity'] = f"Quantity is negative: {parsed_dict['quantity']}"
            except:
                pass
        
        # Zero quantity
        if 'quantity' in parsed_dict:
            try:
                if Decimal(str(parsed_dict['quantity'])) == 0:
                    anomalies['zero_quantity'] = 'Quantity is zero'
            except:
                pass
        
        return anomalies
