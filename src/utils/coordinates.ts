// Extract coordinates from various Google Maps URL formats
export const extractCoordinatesFromUrl = (url: string): { lat: number; lng: number } | null => {
  if (!url) return null;
  
  try {
    // Format 1: @-34.6037,-58.3816 (embedded in URL)
    const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    // Format 2: !3d-34.6037!4d-58.3816 (place URLs)
    const d3d4Match = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
    if (d3d4Match) {
      return { lat: parseFloat(d3d4Match[1]), lng: parseFloat(d3d4Match[2]) };
    }

    // Format 3: q=-34.6037,-58.3816 (query parameter)
    const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (qMatch) {
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }

    // Format 4: ll=-34.6037,-58.3816 (legacy format)
    const llMatch = url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (llMatch) {
      return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
    }

    // Format 5: /place/-34.6037,-58.3816/
    const placeMatch = url.match(/\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (placeMatch) {
      return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
    }

    // Format 6: maps/dir//lat,lng or similar
    const dirMatch = url.match(/\/(-?\d+\.?\d*),(-?\d+\.?\d*)(?:\/|$|\?)/);
    if (dirMatch) {
      return { lat: parseFloat(dirMatch[1]), lng: parseFloat(dirMatch[2]) };
    }

    return null;
  } catch {
    return null;
  }
};

// Validate Google Maps URL format
export const isValidGoogleMapsUrl = (url: string): boolean => {
  if (!url) return false;
  const googleMapsPatterns = [
    /google\.com\/maps/i,
    /maps\.google\.com/i,
    /goo\.gl\/maps/i,
    /maps\.app\.goo\.gl/i,
  ];
  return googleMapsPatterns.some(pattern => pattern.test(url));
};

// Format distance for display
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

// Parse address or coordinates input
export const parseLocationInput = async (input: string): Promise<{ lat: number; lng: number; address: string } | null> => {
  // Check if it's a Google Maps URL
  if (isValidGoogleMapsUrl(input)) {
    const coords = extractCoordinatesFromUrl(input);
    if (coords) {
      return { ...coords, address: 'Ubicación desde Google Maps' };
    }
  }

  // Check if it's coordinates format: lat,lng or lat, lng
  const coordsMatch = input.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (coordsMatch) {
    return {
      lat: parseFloat(coordsMatch[1]),
      lng: parseFloat(coordsMatch[2]),
      address: `${coordsMatch[1]}, ${coordsMatch[2]}`
    };
  }

  // For address search, we'll use Nominatim (OpenStreetMap's free geocoding service)
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=1`,
      {
        headers: {
          'Accept-Language': 'es',
        }
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: data[0].display_name
      };
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
  }

  return null;
};
