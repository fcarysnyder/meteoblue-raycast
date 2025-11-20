import { LocationSearchResult, LocationSearchResponse, WeatherForecastResponse, ApiError } from "./types";

const METEOBLUE_BASE_URL = "https://my.meteoblue.com";

/**
 * Search for a location by city name using meteoblue location search API
 */
export async function searchLocation(query: string, apikey: string): Promise<LocationSearchResult[]> {
  if (!query || query.trim().length === 0) {
    throw new Error("Location query cannot be empty");
  }

  if (!apikey) {
    throw new Error("API key is required");
  }

  try {
    const url = `${METEOBLUE_BASE_URL}/ns1/search?query=${encodeURIComponent(query)}&apikey=${apikey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API request failed with status ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText) as ApiError;
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const data = (await response.json()) as LocationSearchResponse;
    return data.results || [];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to search location: " + String(error));
  }
}

/**
 * Get weather forecast for a specific location using Basic and Current packages
 */
export async function getWeatherForecast(
  lat: number,
  lon: number,
  apikey: string,
  elevation?: number
): Promise<WeatherForecastResponse> {
  if (!apikey) {
    throw new Error("API key is required");
  }

  if (isNaN(lat) || isNaN(lon)) {
    throw new Error("Invalid latitude or longitude");
  }

  try {
    // Combine basic-1h and current packages in one request
    // Using 1h resolution for basic package
    let url = `${METEOBLUE_BASE_URL}/packages/basic-1h_current?lat=${lat}&lon=${lon}&apikey=${apikey}`;
    
    if (elevation !== undefined && !isNaN(elevation)) {
      url += `&asl=${elevation}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API request failed with status ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText) as ApiError;
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const data = (await response.json()) as WeatherForecastResponse;
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch weather forecast: " + String(error));
  }
}

/**
 * Get current location coordinates using browser geolocation API
 */
export function getCurrentLocation(): Promise<{ lat: number; lon: number; elevation?: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          elevation: position.coords.altitude !== null && !isNaN(position.coords.altitude) 
            ? Math.round(position.coords.altitude) 
            : undefined,
        });
      },
      (error) => {
        let errorMessage = "Failed to get current location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
          default:
            errorMessage = `Location error: ${error.message}`;
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}


