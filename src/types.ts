// TypeScript interfaces for meteoblue API responses

export interface LocationSearchResult {
  id: string;
  name: string;
  country: string;
  admin1?: string;
  admin2?: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone?: string;
}

export interface LocationSearchResponse {
  results: LocationSearchResult[];
}

export interface TimeStep {
  time: string;
  precipitation?: number;
  snowfraction?: number;
  rainspot?: string;
  temperature?: number;
  felttemperature?: number;
  pictocode?: number;
  windspeed?: number;
  winddirection?: number;
  relativehumidity?: number;
  sealevelpressure?: number;
  totalcloudcover?: number;
  uvindex?: number;
  predictability?: number;
}

export interface BasicPackage {
  units: {
    time: string;
    precipitation: string;
    snowfraction: string;
    temperature: string;
    felttemperature: string;
    windspeed: string;
    winddirection: string;
    relativehumidity: string;
    sealevelpressure: string;
    totalcloudcover: string;
    uvindex: string;
    predictability: string;
  };
  data_1h?: TimeStep[];
  data_3h?: TimeStep[];
  data_15min?: TimeStep[];
  data_day?: TimeStep[];
}

export interface CurrentPackage {
  units: {
    time: string;
    temperature: string;
    windspeed: string;
    winddirection: string;
    relativehumidity: string;
    sealevelpressure: string;
    pictocode: string;
    uvindex: string;
    isdaylight: string;
  };
  data_1h: TimeStep[];
}

export interface WeatherForecastResponse {
  metadata?: {
    version?: string;
    modelrun_init?: string;
    modelrun_init_utc?: string;
    modelrun_updated?: string;
    modelrun_updated_utc?: string;
    location?: {
      latitude: number;
      longitude: number;
      elevation?: number;
      timezone?: string;
    };
  };
  units?: Record<string, string>;
  basic?: BasicPackage;
  current?: CurrentPackage;
}

export interface ApiError {
  error: string;
  message?: string;
}


