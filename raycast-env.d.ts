/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** meteoblue API Key - Your meteoblue API key (get it from meteoblue.com) */
  "apikey": string,
  /** Temperature Unit - Unit for temperature values */
  "temperatureUnit": "F" | "C",
  /** Wind Speed Unit - Unit for wind speed values */
  "windspeedUnit": "mph" | "kmh" | "ms" | "kn",
  /** Precipitation Unit - Unit for precipitation values */
  "precipitationUnit": "inch" | "mm"
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `meteoblue` command */
  export type Meteoblue = ExtensionPreferences & {}
  /** Preferences accessible in the `today` command */
  export type Today = ExtensionPreferences & {}
  /** Preferences accessible in the `forecast` command */
  export type Forecast = ExtensionPreferences & {}
  /** Preferences accessible in the `rain` command */
  export type Rain = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `meteoblue` command */
  export type Meteoblue = {}
  /** Arguments passed to the `today` command */
  export type Today = {}
  /** Arguments passed to the `forecast` command */
  export type Forecast = {}
  /** Arguments passed to the `rain` command */
  export type Rain = {}
}

