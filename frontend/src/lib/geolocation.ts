export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ReverseGeocodeResult {
  address: string;
  district: string;
  city: string;
}

export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tu navegador no soporta geolocalización.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const messages: Record<number, string> = {
          1: 'Permiso de ubicación denegado.',
          2: 'No se pudo determinar tu ubicación.',
          3: 'La solicitud de ubicación expiró.',
        };
        reject(new Error(messages[err.code] ?? 'No se pudo obtener tu ubicación.'));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/**
 * Geocodificación inversa vía Nominatim (OpenStreetMap) — gratuita y sin
 * API key, a diferencia de la Geocoding API de Google. Uso ligero (un
 * clic del cliente en checkout) está dentro de su política de uso justo.
 * Si el volumen crece, migrar a Google Geocoding API con key propia.
 */
export async function reverseGeocode({ lat, lng }: Coordinates): Promise<ReverseGeocodeResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('No se pudo obtener la dirección de tu ubicación.');

  const data = await res.json();
  const a = data.address ?? {};

  const street = [a.road, a.house_number].filter(Boolean).join(' ');
  const address = street || data.display_name || '';
  const district = a.suburb || a.city_district || a.town || a.village || a.neighbourhood || '';
  const city = a.city || a.county || 'Lima';

  return { address, district, city };
}

export function googleMapsLink({ lat, lng }: Coordinates): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
