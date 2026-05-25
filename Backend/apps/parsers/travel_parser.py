"""
Corporate travel data parser.

Handles CSV exports from corporate travel platforms:
- Concur (SAP Concur)
- Navan
- TravelPerk
- Generic Expedia for Business exports

Covers:
- Flights (Scope 3)
- Hotels (Scope 3)
- Ground transport (Scope 3)

Real travel data challenges:
- Missing distance (only airport codes provided)
- Multiple transport modes in single trip
- Various date formats
- Airline/hotel names with special characters
"""

from decimal import Decimal
from apps.parsers.base_parser import BaseParser, ValidationError


class TravelParser(BaseParser):
    """
    Parser for corporate travel platform exports.
    
    Expected columns:
    - Employee: Employee email or name
    - TravelType: FLIGHT, HOTEL, GROUND, BUS, TRAIN, TAXI, etc.
    - Origin: City or airport code
    - Destination: City or airport code
    - Distance: Distance in kilometers (optional for flights with airport codes)
    - AirportCode: IATA code (e.g., LHR, JFK, BER)
    - HotelNights: Number of hotel nights
    - TravelDate: Date of travel
    - Vendor: Airline, hotel, or transport company
    """
    
    SOURCE_TYPE = 'TRAVEL'
    
    REQUIRED_FIELDS = ['employee', 'traveltype', 'origin', 'destination', 'traveldate']
    
    TRAVEL_TYPES = {
        'flight': ['flight', 'air', 'airline', 'plane'],
        'hotel': ['hotel', 'accommodation', 'lodging', 'stay'],
        'ground': ['ground', 'taxi', 'uber', 'car', 'transport'],
        'train': ['train', 'rail', 'railway', 'db'],
        'bus': ['bus', 'coach', 'shuttle'],
    }
    
    def _parse_impl(self, row_dict: dict) -> dict:
        """Parse travel record."""
        
        normalized_row = self._normalize_headers(row_dict)
        
        # Employee (optional but useful for audit)
        employee = normalized_row.get('employee', '')
        employee = self.validate_string(employee, 'Employee', max_length=255) if employee else ''
        
        # Travel type
        travel_type_raw = self.validate_string(
            normalized_row.get('traveltype', ''),
            'TravelType'
        )
        travel_type = self._categorize_travel_type(travel_type_raw)
        
        # Origin and destination
        origin = self.validate_string(
            normalized_row.get('origin', ''),
            'Origin',
            max_length=100
        )
        
        destination = self.validate_string(
            normalized_row.get('destination', ''),
            'Destination',
            max_length=100
        )
        
        # Travel date
        travel_date = self.validate_date(
            normalized_row.get('traveldate', ''),
            'TravelDate'
        )
        
        # Distance (optional but crucial for flights)
        distance = None
        distance_raw = normalized_row.get('distance', '')
        if distance_raw:
            try:
                distance = float(
                    str(distance_raw).strip().replace('km', '').replace('~', '')
                )
                if distance < 0:
                    raise ValidationError(f"Distance cannot be negative: {distance}")
            except (ValueError, AttributeError):
                distance = None
        
        # Airport code (optional, for flights)
        airport_code = normalized_row.get('airportcode', '').upper().strip() or None
        
        # Hotel nights (for hotel records)
        hotel_nights = None
        hotel_nights_raw = normalized_row.get('hotelnights', '')
        if hotel_nights_raw:
            try:
                hotel_nights = int(float(str(hotel_nights_raw).strip()))
                if hotel_nights < 0:
                    raise ValidationError(f"Hotel nights cannot be negative: {hotel_nights}")
            except (ValueError, AttributeError):
                hotel_nights = None
        
        # Vendor
        vendor = self.standardize_vendor_name(
            normalized_row.get('vendor', '')
        )
        
        # Determine scope and category
        scope = 3  # All travel is Scope 3
        category = self._determine_category(travel_type)
        
        # Anomaly detection
        anomalies = {}
        
        # Flag if flight without distance
        if travel_type == 'flight' and distance is None:
            anomalies['missing_distance'] = (
                'Flight record missing distance. Can use airport code to estimate. '
                'Analyst should verify.'
            )
        
        # Flag if hotel without nights
        if travel_type == 'hotel' and hotel_nights is None:
            anomalies['missing_hotel_nights'] = (
                'Hotel record missing number of nights. Required for CO2e calculation.'
            )
        
        # Flag if distance is unusually high
        if distance and distance > 50000:
            anomalies['unusual_distance'] = (
                f'Distance {distance} km is extremely high. '
                'Verify unit (should be km, not meters).'
            )
        
        return {
            'source_type': self.SOURCE_TYPE,
            'scope': scope,
            'category': category,
            'facility_code': employee,  # Use employee as identifier
            'facility_name': '',  # Travel doesn't have facility context
            'quantity': distance if distance else hotel_nights or 0,
            'unit': 'km' if travel_type == 'flight' else 'nights' if travel_type == 'hotel' else 'trip',
            'quantity_standardized': 0,  # Will be calculated by emission factor
            'date': travel_date,
            'vendor': vendor,
            'document_type': 'TRAVEL',
            'travel_type': travel_type,
            'origin': origin,
            'destination': destination,
            'distance': distance,
            'airport_code': airport_code,
            'hotel_nights': hotel_nights,
            'employee': employee,
            'anomalies': anomalies,
            'notes': self._generate_notes(travel_type, distance, hotel_nights, origin, destination),
        }
    
    def _normalize_headers(self, row_dict: dict) -> dict:
        """Normalize header names to canonical form."""
        header_map = {
            'employee': ['employee', 'employeeid', 'email', 'name', 'person'],
            'traveltype': ['traveltype', 'travel_type', 'type', 'category'],
            'origin': ['origin', 'from', 'departure', 'start_city'],
            'destination': ['destination', 'to', 'arrival', 'end_city'],
            'distance': ['distance', 'distance_km', 'km', 'miles'],
            'airportcode': ['airportcode', 'airport_code', 'iata', 'code'],
            'hotelnights': ['hotelnights', 'hotel_nights', 'nights'],
            'traveldate': ['traveldate', 'travel_date', 'date', 'departure_date'],
            'vendor': ['vendor', 'airline', 'hotel', 'company', 'provider'],
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
    
    def _categorize_travel_type(self, travel_type_raw: str) -> str:
        """
        Categorize travel type into standard categories.
        
        Args:
            travel_type_raw: Raw travel type string
        
        Returns:
            Standardized travel type
        """
        travel_type_norm = travel_type_raw.lower().strip()
        
        for canonical, variations in self.TRAVEL_TYPES.items():
            if travel_type_norm in variations:
                return canonical
            if any(var in travel_type_norm for var in variations):
                return canonical
        
        # Default to ground if unknown
        return 'ground'
    
    def _determine_category(self, travel_type: str) -> str:
        """Determine emission category based on travel type."""
        if travel_type == 'flight':
            return 'travel_flight'
        elif travel_type == 'hotel':
            return 'travel_hotel'
        elif travel_type in ['ground', 'taxi', 'uber', 'car']:
            return 'travel_ground'
        elif travel_type in ['train', 'bus']:
            return 'travel_ground'
        else:
            return 'travel_ground'
    
    def _generate_notes(self, travel_type: str, distance, hotel_nights, origin, destination) -> str:
        """Generate human-readable notes about the travel record."""
        if travel_type == 'flight':
            if distance:
                return f'Flight {origin} → {destination} ({distance} km)'
            else:
                return f'Flight {origin} → {destination}'
        elif travel_type == 'hotel':
            return f'Hotel stay in {destination} ({hotel_nights} nights)' if hotel_nights else f'Hotel in {destination}'
        elif travel_type in ['train', 'bus']:
            if distance:
                return f'{travel_type.capitalize()} {origin} → {destination} ({distance} km)'
            else:
                return f'{travel_type.capitalize()} {origin} → {destination}'
        else:
            if distance:
                return f'Ground transport {origin} → {destination} ({distance} km)'
            else:
                return f'Ground transport {origin} → {destination}'
