import { useState, useEffect, useCallback } from "react";
import {
  List,
  ActionPanel,
  Action,
  Icon,
  showToast,
  Toast,
  getPreferenceValues,
  Detail,
} from "@raycast/api";
import { searchLocation, getWeatherForecast, getCurrentLocation } from "./api";
import { LocationSearchResult, WeatherForecastResponse, TimeStep } from "./types";

interface Preferences {
  apikey: string;
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [locationResults, setLocationResults] = useState<LocationSearchResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherForecastResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLocationSearch, setShowLocationSearch] = useState(true);

  // Check if API key is configured
  useEffect(() => {
    if (!preferences.apikey || preferences.apikey.trim().length === 0) {
      setError("Please configure your meteoblue API key in extension preferences (⌘,).");
    }
  }, [preferences.apikey]);

  const handleLocationSearch = useCallback(async (query: string) => {
    if (!preferences.apikey) {
      setError("API key is required. Please configure it in extension preferences.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const results = await searchLocation(query, preferences.apikey);
      setLocationResults(results);
      setShowLocationSearch(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to search location";
      setError(errorMessage);
      showToast({
        style: Toast.Style.Failure,
        title: "Search Failed",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [preferences.apikey]);

  // Search for locations when search text changes
  useEffect(() => {
    if (searchText.length >= 2 && preferences.apikey) {
      const timeoutId = setTimeout(() => {
        handleLocationSearch(searchText);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setLocationResults([]);
      setShowLocationSearch(true);
    }
  }, [searchText, preferences.apikey, handleLocationSearch]);

  const handleUseCurrentLocation = async () => {
    if (!preferences.apikey) {
      setError("API key is required. Please configure it in extension preferences.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowLocationSearch(false);

    try {
      showToast({
        style: Toast.Style.Animated,
        title: "Getting location...",
      });

      const location = await getCurrentLocation();
      await fetchWeatherData(location.lat, location.lon, location.elevation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get current location";
      setError(errorMessage);
      showToast({
        style: Toast.Style.Failure,
        title: "Location Error",
        message: errorMessage,
      });
      setIsLoading(false);
    }
  };

  const handleSelectLocation = async (location: LocationSearchResult) => {
    setSelectedLocation(location);
    setShowLocationSearch(false);
    await fetchWeatherData(location.latitude, location.longitude, location.elevation);
  };

  const fetchWeatherData = async (lat: number, lon: number, elevation?: number) => {
    if (!preferences.apikey) {
      setError("API key is required. Please configure it in extension preferences.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      showToast({
        style: Toast.Style.Animated,
        title: "Fetching weather...",
      });

      const data = await getWeatherForecast(lat, lon, preferences.apikey, elevation);
      setWeatherData(data);
      showToast({
        style: Toast.Style.Success,
        title: "Weather updated",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch weather data";
      setError(errorMessage);
      showToast({
        style: Toast.Style.Failure,
        title: "Weather Fetch Failed",
        message: errorMessage,
      });
      setWeatherData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTemperature = (temp: number | undefined, unit: string = "°C") => {
    if (temp === undefined || isNaN(temp)) return "N/A";
    return `${Math.round(temp)}${unit}`;
  };

  const formatWindSpeed = (speed: number | undefined, unit: string = "km/h") => {
    if (speed === undefined || isNaN(speed)) return "N/A";
    return `${Math.round(speed)} ${unit}`;
  };

  const formatPrecipitation = (precip: number | undefined, unit: string = "mm") => {
    if (precip === undefined || isNaN(precip)) return "0 " + unit;
    return `${precip.toFixed(1)} ${unit}`;
  };

  const getWeatherIcon = (pictocode: number | undefined) => {
    if (pictocode === undefined) return Icon.QuestionMark;
    // Pictocode mapping (simplified)
    if (pictocode === 1) return Icon.Sun;
    if (pictocode >= 2 && pictocode <= 4) return Icon.Cloud;
    if (pictocode >= 5 && pictocode <= 8) return Icon.CloudRain;
    if (pictocode === 9) return Icon.CloudRain;
    return Icon.Cloud;
  };

  // Error state - API key missing
  if (!preferences.apikey || preferences.apikey.trim().length === 0) {
    return (
      <List>
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="API Key Required"
          description="Please configure your meteoblue API key in extension preferences (⌘,)."
        />
      </List>
    );
  }

  // Show location search results
  if (showLocationSearch && locationResults.length > 0 && !selectedLocation && !weatherData) {
    return (
      <List
        isLoading={isLoading}
        searchBarPlaceholder="Search for a city..."
        onSearchTextChange={setSearchText}
        throttle
      >
        <List.Section title="Search Locations">
          {locationResults.map((location) => (
            <List.Item
              key={location.id}
              title={location.name}
              subtitle={`${location.country}${location.admin1 ? `, ${location.admin1}` : ""}`}
              accessoryTitle={`${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}
              actions={
                <ActionPanel>
                  <Action
                    title="Select Location"
                    icon={Icon.Check}
                    onAction={() => handleSelectLocation(location)}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
        <List.Section title="Actions">
          <List.Item
            title="Use Current Location"
            icon={Icon.Location}
            actions={
              <ActionPanel>
                <Action
                  title="Use Current Location"
                  icon={Icon.Location}
                  onAction={handleUseCurrentLocation}
                />
              </ActionPanel>
            }
          />
        </List.Section>
      </List>
    );
  }

  // Show weather data
  if (weatherData) {
    const currentData = weatherData.current?.data_1h?.[0];
    const basicData = weatherData.basic?.data_1h || [];
    const locationName = selectedLocation
      ? `${selectedLocation.name}, ${selectedLocation.country}`
      : "Current Location";

    return (
      <List
        isLoading={isLoading}
        searchBarPlaceholder="Search for a city..."
        onSearchTextChange={(text) => {
          if (text.length >= 2) {
            setShowLocationSearch(true);
            setWeatherData(null);
            setSelectedLocation(null);
            setSearchText(text);
          }
        }}
        throttle
      >
        <List.Section title="Current Conditions">
          {currentData && (
            <List.Item
              title={locationName}
              subtitle={`${formatTemperature(currentData.temperature, weatherData.current?.units?.temperature || "°C")}`}
              icon={getWeatherIcon(currentData.pictocode)}
              actions={
                <ActionPanel>
                  <Action
                    title="Refresh"
                    icon={Icon.ArrowClockwise}
                    onAction={() => {
                      if (selectedLocation) {
                        fetchWeatherData(
                          selectedLocation.latitude,
                          selectedLocation.longitude,
                          selectedLocation.elevation
                        );
                      }
                    }}
                  />
                  <Action
                    title="Use Current Location"
                    icon={Icon.Location}
                    onAction={handleUseCurrentLocation}
                  />
                  <Action
                    title="Search Location"
                    icon={Icon.MagnifyingGlass}
                    onAction={() => {
                      setShowLocationSearch(true);
                      setWeatherData(null);
                      setSelectedLocation(null);
                    }}
                  />
                </ActionPanel>
              }
            />
          )}
        </List.Section>

        {currentData && (
          <List.Section title="Current Details">
            <List.Item
              title="Temperature"
              subtitle={formatTemperature(currentData.temperature, weatherData.current?.units?.temperature || "°C")}
              icon={Icon.Temperature}
            />
            <List.Item
              title="Feels Like"
              subtitle={formatTemperature(currentData.felttemperature, weatherData.basic?.units?.felttemperature || "°C")}
              icon={Icon.Temperature}
            />
            <List.Item
              title="Wind Speed"
              subtitle={formatWindSpeed(currentData.windspeed, weatherData.current?.units?.windspeed || "km/h")}
              icon={Icon.Gauge}
            />
            <List.Item
              title="Relative Humidity"
              subtitle={currentData.relativehumidity ? `${Math.round(currentData.relativehumidity)}%` : "N/A"}
              icon={Icon.Drop}
            />
            {currentData.sealevelpressure && (
              <List.Item
                title="Pressure"
                subtitle={`${Math.round(currentData.sealevelpressure)} ${weatherData.current?.units?.sealevelpressure || "hPa"}`}
                icon={Icon.Gauge}
              />
            )}
            {currentData.uvindex !== undefined && (
              <List.Item
                title="UV Index"
                subtitle={Math.round(currentData.uvindex).toString()}
                icon={Icon.Sun}
              />
            )}
          </List.Section>
        )}

        <List.Section title="Hourly Forecast" subtitle={`${basicData.length} hours`}>
          {basicData.slice(0, 24).map((item, index) => {
            const date = new Date(item.time);
            const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const dateStr = index === 0 ? "Now" : date.toLocaleDateString([], { weekday: "short", hour: "2-digit" });

            return (
              <List.Item
                key={item.time}
                title={`${dateStr} ${timeStr}`}
                subtitle={`${formatTemperature(item.temperature, weatherData.basic?.units?.temperature || "°C")} • ${formatPrecipitation(item.precipitation, weatherData.basic?.units?.precipitation || "mm")} • ${formatWindSpeed(item.windspeed, weatherData.basic?.units?.windspeed || "km/h")}`}
                icon={getWeatherIcon(item.pictocode)}
                actions={
                  <ActionPanel>
                    <Action.Push
                      title="View Details"
                      icon={Icon.Info}
                      target={
                        <Detail
                          markdown={`# Weather Details\n\n**Time:** ${new Date(item.time).toLocaleString()}\n\n**Temperature:** ${formatTemperature(item.temperature, weatherData.basic?.units?.temperature || "°C")}\n**Feels Like:** ${formatTemperature(item.felttemperature, weatherData.basic?.units?.felttemperature || "°C")}\n**Precipitation:** ${formatPrecipitation(item.precipitation, weatherData.basic?.units?.precipitation || "mm")}\n**Wind Speed:** ${formatWindSpeed(item.windspeed, weatherData.basic?.units?.windspeed || "km/h")}\n**Wind Direction:** ${item.winddirection ? `${Math.round(item.winddirection)}°` : "N/A"}\n**Humidity:** ${item.relativehumidity ? `${Math.round(item.relativehumidity)}%` : "N/A"}\n**Pressure:** ${item.sealevelpressure ? `${Math.round(item.sealevelpressure)} ${weatherData.basic?.units?.sealevelpressure || "hPa"}` : "N/A"}\n**UV Index:** ${item.uvindex !== undefined ? Math.round(item.uvindex).toString() : "N/A"}\n**Predictability:** ${item.predictability !== undefined ? `${Math.round(item.predictability)}%` : "N/A"}`}
                        />
                      }
                    />
                  </ActionPanel>
                }
              />
            );
          })}
        </List.Section>

        <List.Section title="Actions">
          <List.Item
            title="Use Current Location"
            icon={Icon.Location}
            actions={
              <ActionPanel>
                <Action
                  title="Use Current Location"
                  icon={Icon.Location}
                  onAction={handleUseCurrentLocation}
                />
              </ActionPanel>
            }
          />
          <List.Item
            title="Search New Location"
            icon={Icon.MagnifyingGlass}
            actions={
              <ActionPanel>
                <Action
                  title="Search Location"
                  icon={Icon.MagnifyingGlass}
                  onAction={() => {
                    setShowLocationSearch(true);
                    setWeatherData(null);
                    setSelectedLocation(null);
                    setSearchText("");
                  }}
                />
              </ActionPanel>
            }
          />
        </List.Section>
      </List>
    );
  }

  // Empty state - initial load
  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search for a city..."
      onSearchTextChange={setSearchText}
      throttle
    >
      <List.EmptyView
        icon={Icon.MagnifyingGlass}
        title="Search for Weather"
        description="Enter a city name or use your current location to see weather forecasts"
        actions={
          <ActionPanel>
            <Action
              title="Use Current Location"
              icon={Icon.Location}
              onAction={handleUseCurrentLocation}
            />
          </ActionPanel>
        }
      />
    </List>
  );
}

