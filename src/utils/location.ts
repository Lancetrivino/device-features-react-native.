import * as Location from 'expo-location';

export interface AddressResult {
  address: string;
  latitude: number;
  longitude: number;
}

export const getCurrentLocation = async (): Promise<AddressResult | null> => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation, // ← GPS-level, was Balanced
    });

    const { latitude, longitude } = location.coords;
    const address = await reverseGeocode(latitude, longitude);

    return { address, latitude, longitude };
  } catch (error) {
    console.error('[Location] Failed to get current location:', error);
    return null;
  }
};

export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });

    if (!results || results.length === 0) {
      return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }

    const p = results[0];

    // Build address from most-specific → least-specific, skipping duplicates
    const seen = new Set<string>();
    const push = (val: string | null | undefined) => {
      if (val && val.trim() && !seen.has(val.trim())) {
        seen.add(val.trim());
        return val.trim();
      }
      return null;
    };

    const parts: string[] = [
      push(p.name),           // POI / building name  e.g. "Robinsons Galleria"
      push(p.streetNumber),   // house / unit number  e.g. "32"
      push(p.street),         // road name            e.g. "EDSA"
      push(p.district),       // barangay / suburb    e.g. "Ortigas Center"
      push(p.subregion),      // municipality / area  e.g. "Quezon City"
      push(p.city),           // city                 e.g. "Quezon City"
      push(p.region),         // province / state     e.g. "Metro Manila"
    ].filter((v): v is string => v !== null);

    if (parts.length === 0) {
      return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }

    return parts.join(', ');
  } catch (error) {
    console.error('[Location] Reverse geocode failed:', error);
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }
};

export const formatCoordinates = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}°${latDir}  ${Math.abs(lng).toFixed(5)}°${lngDir}`;
};