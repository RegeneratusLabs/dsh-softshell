/**
 * dsh-softshell — place and time grounding, plus a weather tool.
 *
 * WHY THIS EXISTS
 * A personal assistant is asked "should I take a jacket?" or "what time is it
 * there?". The model has no clock it can trust and no idea where the user is,
 * and a wrong guess here is not a small error: every date, greeting and
 * clothing suggestion downstream inherits it. So this plugin owns exactly two
 * facts and makes them cheap:
 *
 *   1. one system-prompt line, re-rendered per request, that says where the
 *      user is and what the local time is ("Right now: … — Testville, Example Region
 *      (Europe/Berlin)."). It is re-rendered, not baked at boot, because a
 *      static line would be right exactly once.
 *   2. two ordinary tools: `ambient_place` to read/write the profile, and
 *      `ambient_weather` for current conditions plus a short forecast.
 *
 * DESIGN RULES
 *  - Host-only, no client half, no API key, no new dependency: node:fs, Intl,
 *    URLSearchParams and global fetch are the whole surface.
 *  - The state file is `$DSH_HOME/ambient/profile.json` (directory 0700, file
 *    0600, atomic write-then-rename). It is data the human owns; a missing or
 *    corrupt file is a no-op with one warning, never a boot failure.
 *  - The prompt section is one line, literal (`interpolate: false`) and capped
 *    at 300 chars, so a runaway profile cannot inflate every request.
 *  - Network egress happens only inside `ambient_weather`, at call time, to
 *    Open-Meteo (geocoding + forecast; no key). Every failure becomes a plain
 *    "Weather unavailable: …" tool result: a weather call must never throw,
 *    because a thrown tool error reads as "the assistant is broken" when the
 *    honest answer is "the forecast is not reachable".
 *
 * SECTION PLACEMENT
 * `dsh-system-prompt` owns the `deployment:persona-prefix` section name, so a
 * plugin registering that exact name throws at boot. This plugin uses a unique
 * name ('deployment:ambient') at the same centrally allocated order
 * (`getSectionOrder('DEPLOYMENT_PERSONA_PREFIX')`, 0), which puts the line at
 * the top of the prompt ahead of first-party guidance — where a grounding fact
 * belongs — without colliding with the persona prefix itself. Equal orders sort
 * by name, so with both soul and ambient loaded the ambient line renders first.
 *
 * @module @local/dsh-softshell
 */

import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** This plugin's Loader row id / Cordis plugin name. */
export const name = 'dsh-softshell';

/** The two services this plugin needs: the prompt registry and the tool registry. */
export const inject = ['systemPrompt', 'tools'];

/** Unique prompt section name; the persona-prefix name itself is owned by DSH. */
const SECTION_NAME = 'deployment:ambient';
/** Centrally allocated slot this section joins (see module doc). */
const SECTION_ORDER_NAME = 'DEPLOYMENT_PERSONA_PREFIX';
/** Hard cap on the rendered section; prompts repeat per step, so this is cheap forever. */
const SECTION_MAX_CHARS = 300;
/** Per-field cap for profile strings; keeps a hand-edited file from becoming a prompt bomb. */
const MAX_FIELD_CHARS = 300;
/** The fallback home: this product's own default when DSH_HOME is not set. */
const DEFAULT_HOME = path.join(os.homedir(), '.dsh-assistant');
/** Tool-visible units. */
const UNITS = ['metric', 'imperial'];
/** Open-Meteo endpoints; both are keyless and read-only. */
const GEOCODE_BASE = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';
/** One budget for the whole call (geocode + forecast), not one per request. */
const WEATHER_TIMEOUT_MS = 8000;
/** Forecasts change slowly; a ten-minute per-coordinate cache keeps chatty turns quiet. */
const WEATHER_CACHE_MS = 10 * 60 * 1000;
/** `days` is a count of forecast days; 0 means current conditions only. */
const MAX_FORECAST_DAYS = 3;
/** WMO weather interpretation codes, kept only as short model-facing words. */
const WMO_TEXT = {
  0: 'clear',
  1: 'mostly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'freezing fog',
  51: 'light drizzle',
  53: 'drizzle',
  55: 'heavy drizzle',
  56: 'freezing drizzle',
  57: 'heavy freezing drizzle',
  61: 'light rain',
  63: 'rain',
  65: 'heavy rain',
  66: 'freezing rain',
  67: 'heavy freezing rain',
  71: 'light snow',
  73: 'snow',
  75: 'heavy snow',
  77: 'snow grains',
  80: 'light showers',
  81: 'showers',
  82: 'heavy showers',
  85: 'snow showers',
  86: 'heavy snow showers',
  95: 'thunderstorm',
  96: 'thunderstorm with hail',
  99: 'severe thunderstorm with hail',
};

/** In-memory forecast cache keyed by coordinates + request shape; never persisted. */
const weatherCache = new Map();

/** Warnings are once per process per cause; the Host log (journald) is the local sink. */
const warned = new Set();

/**
 * Emit one warning per key. stderr, because in one-shot headless runs stdout is
 * the answer channel and in the Web Host both streams reach journald.
 * @param key - dedupe key.
 * @param message - text to log once.
 */
function warnOnce(key, message) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[dsh-softshell] ${message}`);
}

/**
 * A non-empty, whitespace-collapsed, length-capped string, or `undefined`.
 * Collapsing happens here so a place name with a newline can never break the
 * one-line prompt contract.
 * @param value - candidate value, of any type.
 * @returns the cleaned string, or `undefined` when absent/blank/not a string.
 */
function cleanText(value) {
  if (typeof value !== 'string') return undefined;
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > 0 ? text.slice(0, MAX_FIELD_CHARS) : undefined;
}

/**
 * A finite number inside a closed range, or `undefined`. Numeric strings are
 * accepted because a patch row may quote its values.
 * @param value - candidate value.
 * @param min - lower bound.
 * @param max - upper bound.
 * @returns the number, or `undefined` when absent/out of range/not numeric.
 */
function numberOf(value, min, max) {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN;
  if (!Number.isFinite(number) || number < min || number > max) return undefined;
  return number;
}

/**
 * Normalize a units value to the two supported spellings.
 * @param value - candidate units value.
 * @returns `'metric'` or `'imperial'`, or `undefined` when unrecognized.
 */
function unitsOf(value) {
  if (typeof value !== 'string') return undefined;
  const text = value.trim().toLowerCase();
  return UNITS.includes(text) ? text : undefined;
}

/**
 * Resolve the effective units, defaulting to metric.
 * @param value - candidate units value.
 * @returns `'metric'` or `'imperial'`.
 */
function resolveUnits(value) {
  return unitsOf(value) ?? 'metric';
}

/**
 * Is this a time zone `Intl` accepts? The IANA database in Node is the
 * authority; there is no second list to keep in sync.
 * @param value - candidate IANA time zone name.
 * @returns whether `Intl.DateTimeFormat` accepts it.
 */
export function isValidTimeZone(value) {
  const zone = typeof value === 'string' ? value.trim() : '';
  if (zone.length === 0) return false;
  try {
    new Intl.DateTimeFormat('en-AU', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** This machine's time zone, used only when the profile names none. */
function systemTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Normalize a profile value read from disk, config or a tool call.
 *
 * Shape is a closed set of scalar fields: unknown keys are dropped (the file is
 * user-owned data, not a schema), blank strings become absent, and a malformed
 * time zone is dropped rather than carried into every prompt. `units` stays
 * absent when it was never set so config fallbacks keep working.
 * @param raw - untrusted profile-like object.
 * @returns a clean profile with deterministic field order.
 */
export function normalizeProfile(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const profile = {};
  const place = cleanText(source.place);
  if (place) profile.place = place;
  const region = cleanText(source.region);
  if (region) profile.region = region;
  const timeZone = cleanText(source.timeZone);
  if (timeZone && isValidTimeZone(timeZone)) profile.timeZone = timeZone;
  const units = unitsOf(source.units);
  if (units) profile.units = units;
  const name = cleanText(source.name);
  if (name) profile.name = name;
  const lat = numberOf(source.lat, -90, 90);
  const lon = numberOf(source.lon, -180, 180);
  if (lat !== undefined && lon !== undefined) {
    profile.lat = lat;
    profile.lon = lon;
  }
  const updatedAt = cleanText(source.updatedAt);
  if (updatedAt) profile.updatedAt = updatedAt;
  return profile;
}

/**
 * This process's DSH home: row `config.home`, else `$DSH_HOME`, else this
 * product's own default (`~/.dsh-assistant`). `~/` expands and a relative
 * override resolves against the working directory, so nothing depends on cwd
 * unless the deployment asks for it.
 * @param config - Loader row config.
 * @returns absolute home path.
 */
function dshHome(config) {
  const configured = cleanText(config && config.home);
  if (configured !== undefined) {
    const expanded = configured.startsWith('~/') ? path.join(os.homedir(), configured.slice(2)) : configured;
    return path.resolve(expanded);
  }
  const env = cleanText(process.env.DSH_HOME);
  return env ? path.resolve(env) : DEFAULT_HOME;
}

/**
 * Resolve the state file and the config fallbacks once, at apply time.
 * @param config - Loader row config.
 * @returns resolved paths, registration flags and profile defaults.
 */
function resolveConfig(config) {
  const raw = config || {};
  const home = dshHome(raw);
  const configuredZone = cleanText(raw.timeZone);
  if (configuredZone !== undefined && !isValidTimeZone(configuredZone)) {
    // A typo in a patch row would otherwise silently fall back to the system zone.
    warnOnce(`config-zone:${configuredZone}`, `ignoring configured timeZone "${configuredZone}": not a valid IANA time zone`);
  }
  return {
    home,
    profilePath: path.join(home, 'ambient', 'profile.json'),
    includeClock: raw.includeClock === true,
    weather: raw.weather !== false,
    defaults: normalizeProfile({
      place: raw.place,
      region: raw.region,
      timeZone: raw.timeZone,
      units: raw.units,
      name: raw.name,
      lat: raw.lat,
      lon: raw.lon,
    }),
  };
}

/**
 * Read the profile file, tolerating absence and malformed content. A missing
 * file is a normal fresh install; a corrupt one is reported to the caller so it
 * can warn once, but both degrade to an empty profile instead of throwing.
 * @param file - absolute path.
 * @returns the clean profile plus a `missing` or `error` marker.
 */
export function readProfile(file) {
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') return { profile: normalizeProfile({}), missing: true };
    return { profile: normalizeProfile({}), error: String((error && error.message) || error) };
  }
  try {
    return { profile: normalizeProfile(JSON.parse(raw)) };
  } catch (error) {
    return { profile: normalizeProfile({}), error: `not valid JSON: ${String((error && error.message) || error)}` };
  }
}

/**
 * Persist a profile atomically with 0600 permissions, creating the 0700
 * directory if needed. Errors propagate: a tool call must be able to tell the
 * model the write did not happen.
 * @param file - absolute path.
 * @param profile - profile-like object to persist.
 * @returns the normalized profile that was written.
 */
export function writeProfile(file, profile) {
  const normalized = normalizeProfile(profile);
  if (!normalized.updatedAt) normalized.updatedAt = new Date().toISOString();
  const dir = path.dirname(file);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    chmodSync(dir, 0o700);
  } catch {
    // A directory we cannot chmod (foreign mount) still works; the file mode matters more.
  }
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(temp, `${JSON.stringify(normalized, null, 2)}\n`, { mode: 0o600 });
  try {
    chmodSync(temp, 0o600);
  } catch {
    // The open mode above already requested 0600; chmod is belt-and-braces against umask oddities.
  }
  renameSync(temp, file);
  return normalized;
}

/**
 * Convention over config: row-config fields are fallbacks, and a stored value
 * wins field by field. A field the user clears through the tool therefore falls
 * back to config rather than to nothing; that is the safer of the two.
 * @param defaults - profile from the row config.
 * @param stored - profile from disk.
 * @returns the effective profile.
 */
function mergeProfile(defaults, stored) {
  const merged = { ...defaults };
  for (const [key, value] of Object.entries(stored || {})) {
    if (value !== undefined) merged[key] = value;
  }
  return merged;
}

/**
 * The effective profile: config fallbacks under the current file contents.
 * Read per prompt assembly and per tool call so a write through `ambient_place`
 * shows up in the running session instead of only after a restart.
 * @param resolved - resolved plugin config.
 * @returns the effective profile.
 */
function currentProfile(resolved) {
  const loaded = readProfile(resolved.profilePath);
  if (loaded.error) {
    warnOnce(`corrupt:${resolved.profilePath}`, `cannot read ${resolved.profilePath} (${loaded.error}); using no ambient profile`);
  }
  return mergeProfile(resolved.defaults, loaded.profile);
}

/**
 * Format a date in one time zone as the two pieces the section needs.
 * `formatToParts` is used instead of `format` so the shape does not depend on
 * ICU's locale data: the example line must read "Tuesday 17 November 2026,
 * 5:26 pm" on every install, not "Tuesday, November 17, 2026, 5:26 PM".
 * @param now - the clock to render.
 * @param timeZone - validated IANA time zone.
 * @returns the date part and the lower-case 12-hour time part.
 */
function formatStamp(now, timeZone) {
  const dateParts = new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).formatToParts(now);
  const dateValue = (type) => (dateParts.find((part) => part.type === type) ?? {}).value ?? '';
  const datePart = `${dateValue('weekday')} ${dateValue('day')} ${dateValue('month')} ${dateValue('year')}`;

  const timeParts = new Intl.DateTimeFormat('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  }).formatToParts(now);
  const timeValue = (type) => (timeParts.find((part) => part.type === type) ?? {}).value ?? '';
  const period = timeValue('dayPeriod').toLowerCase();
  const timePart = `${timeValue('hour')}:${timeValue('minute')}${period ? ` ${period}` : ''}`;
  return { datePart, timePart };
}

/**
 * Cap the one-line section without splitting a surrogate pair.
 * @param text - rendered section.
 * @returns the text, or its 300-char prefix ending in an ellipsis.
 */
function capSection(text) {
  if (text.length <= SECTION_MAX_CHARS) return text;
  let cut = SECTION_MAX_CHARS - 1;
  const code = text.charCodeAt(cut - 1);
  if (code >= 0xd800 && code <= 0xdbff) cut -= 1;
  return `${text.slice(0, cut)}…`;
}

/**
 * Render the one system-prompt line.
 *
 * A configured place always brings the clock, because "where and when" only
 * helps together. Without a place the clock is opt-in (`includeClock`), which
 * is why the caller passes that flag: an unanchored server clock is noise
 * unless the deployment asked for it. Returns `''` when there is nothing
 * truthful to say; the prompt renderer drops empty sections.
 * @param profile - effective profile (`place`, `region`, `timeZone`, `name`, …).
 * @param now - clock to render; injected by the selftest for determinism.
 * @param options - `includeClock: true` enables the clock-only line.
 * @returns one line, at most 300 characters, or `''`.
 */
export function renderSection(profile, now = new Date(), options = {}) {
  const clean = normalizeProfile(profile);
  const hasPlace = Boolean(clean.place || clean.region);
  if (!hasPlace && options.includeClock !== true) return '';

  const at = now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
  const timeZone = clean.timeZone ?? systemTimeZone();
  const { datePart, timePart } = formatStamp(at, timeZone);
  const stamp = `${datePart}, ${timePart}`;

  let text;
  if (hasPlace) {
    const where = [clean.place, clean.region].filter(Boolean).join(', ');
    text = `Right now: ${stamp} — ${where} (${timeZone}).`;
  } else {
    text = `Right now: ${stamp} (${timeZone}).`;
  }
  if (clean.name) text += ` Address the user as ${clean.name}.`;
  return capSection(text);
}

/**
 * Short, human words for a WMO weather code.
 * @param code - raw `weather_code` value.
 * @returns a phrase, or `''` for a code this table does not know.
 */
function describeCode(code) {
  const number = Number(code);
  return Number.isFinite(number) ? WMO_TEXT[Math.trunc(number)] ?? '' : '';
}

/**
 * Round a possibly-missing numeric payload field.
 * @param value - raw payload value.
 * @returns the rounded number, or `undefined`.
 */
function rounded(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : undefined;
}

/**
 * A calendar date label for a daily entry: Today, Tomorrow, then the weekday.
 * The date string is the place's own local date, so it is read at UTC noon to
 * keep the calendar weekday stable.
 * @param date - `YYYY-MM-DD` from the forecast payload.
 * @returns a short label.
 */
function dayLabel(date, index) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const parsed = new Date(`${String(date)}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return new Intl.DateTimeFormat('en-AU', { weekday: 'long', timeZone: 'UTC' }).format(parsed);
}

/**
 * Turn an Open-Meteo forecast payload into the model-facing text block.
 *
 * The payload is expected in the profile's units because {@link forecastUrl}
 * asks for them, so this function only chooses the symbols; it does not convert
 * values. Missing sections are omitted rather than rendered as placeholders.
 * @param payload - parsed `/v1/forecast` JSON.
 * @param profile - effective profile (units and place label).
 * @returns a short text block; `''` when the payload carries no usable values.
 */
export function formatWeather(payload, profile) {
  const clean = normalizeProfile(profile);
  const units = resolveUnits(clean.units);
  const tempUnit = units === 'imperial' ? '°F' : '°C';
  const windUnit = units === 'imperial' ? 'mph' : 'km/h';
  const data = payload && typeof payload === 'object' ? payload : {};
  const where = [clean.place, clean.region].filter(Boolean).join(', ') || cleanText(data.timezone) || 'configured place';
  const lines = [];

  const current = data.current && typeof data.current === 'object' ? data.current : {};
  const temperature = rounded(current.temperature_2m);
  if (temperature !== undefined) {
    const parts = [`${temperature}${tempUnit}`];
    const feels = rounded(current.apparent_temperature);
    if (feels !== undefined) parts.push(`feels ${feels}${tempUnit}`);
    const description = describeCode(current.weather_code);
    if (description) parts.push(description);
    const wind = rounded(current.wind_speed_10m);
    if (wind !== undefined) parts.push(`wind ${wind} ${windUnit}`);
    const humidity = rounded(current.relative_humidity_2m);
    if (humidity !== undefined) parts.push(`humidity ${humidity}%`);
    lines.push(`${where}: ${parts.join(', ')}.`);
  }

  const daily = data.daily && typeof data.daily === 'object' ? data.daily : {};
  const dates = Array.isArray(daily.time) ? daily.time : [];
  for (let index = 0; index < dates.length; index += 1) {
    const high = rounded(daily.temperature_2m_max?.[index]);
    const low = rounded(daily.temperature_2m_min?.[index]);
    if (high === undefined && low === undefined) continue;
    const range = low !== undefined && high !== undefined ? `${low}–${high}${tempUnit}` : `${(low ?? high)}${tempUnit}`;
    const rain = rounded(daily.precipitation_probability_max?.[index]);
    lines.push(`${dayLabel(dates[index], index)}: ${range}${rain === undefined ? '' : `, ${rain}% rain`}.`);
  }
  return lines.join('\n');
}

/**
 * Geocoding URL for a place name. The query is the place only: Open-Meteo's
 * search wants a name, and the region is display sugar, not a filter.
 * @param place - place name.
 * @returns the absolute request URL.
 */
export function geocodeUrl(place) {
  return `${GEOCODE_BASE}?name=${encodeURIComponent(String(place ?? '').trim())}&count=1&language=en&format=json`;
}

/**
 * Forecast URL for one coordinate. Units are sent upstream (not converted
 * locally) so the payload and the number the model reads agree, and `days`
 * below 1 omits the daily block entirely.
 * @param options - `latitude`, `longitude`, `days` (0–3, default 1) and `units`.
 * @returns the absolute request URL.
 */
export function forecastUrl(options = {}) {
  const units = resolveUnits(options.units);
  const days = clampDays(options.days);
  const params = new URLSearchParams();
  params.set('latitude', String(options.latitude));
  params.set('longitude', String(options.longitude));
  params.set('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m');
  if (days > 0) {
    params.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max');
    params.set('forecast_days', String(days));
  }
  params.set('temperature_unit', units === 'imperial' ? 'fahrenheit' : 'celsius');
  params.set('wind_speed_unit', units === 'imperial' ? 'mph' : 'kmh');
  params.set('timezone', 'auto');
  return `${FORECAST_BASE}?${params.toString()}`;
}

/**
 * Clamp the `days` argument to the supported range.
 * @param value - raw argument.
 * @returns an integer 0–3; a missing or non-numeric value defaults to 1.
 */
function clampDays(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.max(0, Math.min(MAX_FORECAST_DAYS, Math.trunc(number)));
}

/** Drop the in-memory forecast cache; used by the selftest for isolation. */
export function clearWeatherCache() {
  weatherCache.clear();
}

/**
 * One HTTP JSON read with the plugin's 8s budget.
 * @param url - absolute request URL.
 * @param signal - caller cancellation, when the tool context supplies one.
 * @returns the parsed JSON body.
 */
async function fetchJson(url, signal) {
  const timeout = AbortSignal.timeout(WEATHER_TIMEOUT_MS);
  const combined = signal instanceof AbortSignal ? AbortSignal.any([signal, timeout]) : timeout;
  const response = await fetch(url, { signal: combined, headers: { accept: 'application/json' } });
  if (!response || response.ok !== true) throw new Error(`HTTP ${response ? response.status : 'no response'}`);
  return response.json();
}

/**
 * Geocode a place name to coordinates.
 * @param place - place name from the profile.
 * @param signal - caller cancellation.
 * @returns `{ lat, lon }`.
 * @throws when the service answers without a result.
 */
async function geocode(place, signal) {
  const body = await fetchJson(geocodeUrl(place), signal);
  const hit = body && Array.isArray(body.results) ? body.results[0] : undefined;
  const lat = Number(hit && hit.latitude);
  const lon = Number(hit && hit.longitude);
  if (!hit || !Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error(`place "${place}" not found`);
  return { lat, lon };
}

/** A short single-line reason for the model; never a stack trace. */
function shortReason(error) {
  const name = error && typeof error === 'object' ? error.name : '';
  if (name === 'TimeoutError' || name === 'AbortError') return `timed out after ${WEATHER_TIMEOUT_MS / 1000}s`;
  const message = String((error && error.message) || error || 'unknown error')
    .replace(/\s+/g, ' ')
    .trim();
  return message.slice(0, 160) || 'unknown error';
}

/** Model-facing text render for a tool result. */
function textResult(text) {
  return [{ type: 'text', text }];
}

/**
 * Render the profile as the short text block both place actions return.
 * @param profile - effective profile.
 * @returns a handful of `field: value` lines.
 */
function profileText(profile) {
  const clean = normalizeProfile(profile);
  const lines = [
    `place: ${clean.place ?? '(not set)'}`,
    `region: ${clean.region ?? '(not set)'}`,
    `timeZone: ${clean.timeZone ?? '(not set)'}`,
    `units: ${clean.units ?? 'metric (default)'}`,
    `name: ${clean.name ?? '(not set)'}`,
  ];
  if (clean.lat !== undefined && clean.lon !== undefined) lines.push(`coordinates: ${clean.lat}, ${clean.lon}`);
  lines.push(`updatedAt: ${clean.updatedAt ?? '(never)'}`);
  return lines.join('\n');
}

/**
 * Build the two tool definitions.
 *
 * Schemas are plain JSON Schema (what the registry projects to the model); the
 * model-facing text is produced by the output renderer, matching the other
 * plugins in this repo.
 * @param resolved - resolved plugin config.
 * @returns the registered tool definitions.
 */
function buildTools(resolved) {
  const output = {
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: { message: { type: 'string' } },
      required: ['message'],
    },
    render: (_args, value) => textResult(value.message),
  };

  /** Unknown top-level fields are rejected, not dropped: silently ignoring a misspelling loses the user's intent. */
  const placeFields = new Set(['action', 'place', 'region', 'timeZone', 'units', 'name']);

  const place = {
    name: 'ambient_place',
    description:
      "Read or update the user's ambient profile: their place, region, IANA time zone, units and the name to address them by. This drives the 'Right now' prompt line and ambient_weather.",
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        action: { type: 'string', enum: ['get', 'set'], description: 'get returns the stored profile; set updates only the fields given.' },
        place: { type: 'string', description: 'City or town, e.g. "Testville". An empty string clears it.' },
        region: { type: 'string', description: 'State or region shown after the place, e.g. "Example Region".' },
        timeZone: { type: 'string', description: 'IANA time zone, e.g. "Europe/Berlin". An empty string clears it.' },
        units: { type: 'string', enum: UNITS, description: 'metric (°C, km/h) or imperial (°F, mph).' },
        name: { type: 'string', description: 'What to call the user, e.g. "Alex". An empty string clears it.' },
      },
      required: ['action'],
    },
    output,
    async execute(args) {
      try {
        const raw = args && typeof args === 'object' ? args : {};
        const unknown = Object.keys(raw).filter((key) => !placeFields.has(key));
        if (unknown.length > 0) {
          return { message: `Not saved: unknown field${unknown.length === 1 ? '' : 's'} ${unknown.join(', ')}. Accepted: ${[...placeFields].join(', ')}.` };
        }
        const action = typeof raw.action === 'string' ? raw.action.trim().toLowerCase() : 'get';
        if (action === 'get') return { message: profileText(currentProfile(resolved)) };
        if (action !== 'set') return { message: `Not saved: unknown action "${String(raw.action)}"; use "get" or "set".` };

        // Edit the stored profile, not the merged one: config fields are
        // fallbacks, so copying them into the file would freeze today's config
        // into the user's data.
        const stored = readProfile(resolved.profilePath).profile;
        const next = { ...stored };

        for (const field of ['place', 'region', 'name']) {
          if (!(field in raw)) continue;
          const value = cleanText(raw[field]);
          if (value === undefined) delete next[field];
          else next[field] = value;
        }
        if ('timeZone' in raw) {
          const zone = cleanText(raw.timeZone);
          if (zone === undefined) delete next.timeZone;
          else if (!isValidTimeZone(zone)) {
            return { message: `Not saved: "${zone}" is not a valid IANA time zone (for example Europe/Berlin, Europe/London, America/New_York).` };
          } else next.timeZone = zone;
        }
        if ('units' in raw) {
          if (cleanText(raw.units) === undefined) delete next.units;
          else if (unitsOf(raw.units) === undefined) {
            return { message: `Not saved: units must be "metric" or "imperial", got "${String(raw.units)}".` };
          } else next.units = unitsOf(raw.units);
        }
        next.updatedAt = new Date().toISOString();
        writeProfile(resolved.profilePath, next);
        return { message: `Ambient profile saved (${resolved.profilePath}).\n${profileText(currentProfile(resolved))}` };
      } catch (error) {
        return { message: `Not saved: ${shortReason(error)}` };
      }
    },
  };

  const weather = {
    name: 'ambient_weather',
    description:
      "Current weather and a short daily forecast for the user's configured place, from Open-Meteo (no key). Use it instead of guessing conditions; for anything beyond three days use web search.",
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        days: {
          type: 'number',
          description: `Daily forecast days, 0–${MAX_FORECAST_DAYS}. 0 = current conditions only; default 1.`,
        },
      },
    },
    output,
    async execute(args, exec) {
      try {
        const raw = args && typeof args === 'object' ? args : {};
        const profile = currentProfile(resolved);
        const days = clampDays(raw.days);
        const units = resolveUnits(profile.units);
        const signal = exec && exec.signal instanceof AbortSignal ? exec.signal : undefined;

        let latitude = profile.lat;
        let longitude = profile.lon;
        if (latitude === undefined || longitude === undefined) {
          if (!profile.place) return { message: 'Weather unavailable: no place configured. Set one with ambient_place.' };
          const found = await geocode(profile.place, signal);
          latitude = found.lat;
          longitude = found.lon;
        }

        const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}|${days}|${units}`;
        const cached = weatherCache.get(key);
        if (cached && Date.now() - cached.at < WEATHER_CACHE_MS) return { message: cached.text };

        const payload = await fetchJson(forecastUrl({ latitude, longitude, days, units }), signal);
        const text = formatWeather(payload, profile);
        if (!text) return { message: 'Weather unavailable: the forecast response carried no usable values.' };
        if (weatherCache.size > 64) {
          // Coordinates are few in practice; prune so a programmatic caller cannot grow this forever.
          const now = Date.now();
          for (const [cachedKey, entry] of weatherCache) if (now - entry.at >= WEATHER_CACHE_MS) weatherCache.delete(cachedKey);
        }
        weatherCache.set(key, { at: Date.now(), text });
        return { message: text };
      } catch (error) {
        return { message: `Weather unavailable: ${shortReason(error)}` };
      }
    },
  };

  return resolved.weather ? [place, weather] : [place];
}

/**
 * Register the ambient profile section and the tools.
 *
 * A fresh profile with no place and `includeClock` off has nothing truthful to
 * say, so no section is registered at all; the tools still are. Registration
 * only decides whether a section can ever render — its text is a provider, so
 * the clock is rebuilt for every request and a place written through the tool
 * appears without a restart.
 * @param ctx - Cordis context carrying `systemPrompt` and `tools`.
 * @param config - Loader row config.
 */
export function apply(ctx, config) {
  const resolved = resolveConfig(config);
  const loaded = readProfile(resolved.profilePath);
  if (loaded.error) {
    warnOnce(`corrupt:${resolved.profilePath}`, `cannot read ${resolved.profilePath} (${loaded.error}); using no ambient profile`);
  } else if (loaded.missing) {
    warnOnce(`missing:${resolved.profilePath}`, `no ambient profile at ${resolved.profilePath}; using row config defaults only (write one with ambient_place)`);
  }

  const initial = mergeProfile(resolved.defaults, loaded.profile);
  const anchored = Boolean(initial.place || initial.region) || resolved.includeClock;
  if (anchored) {
    const allocated = typeof ctx.systemPrompt.getSectionOrder === 'function'
      ? ctx.systemPrompt.getSectionOrder(SECTION_ORDER_NAME)
      : undefined;
    const order = Number.isFinite(allocated) ? allocated : 0;
    ctx.effect(() => {
      const dispose = ctx.systemPrompt.section({
        name: SECTION_NAME,
        order,
        interpolate: false,
        text: () => {
          try {
            return renderSection(currentProfile(resolved), new Date(), { includeClock: resolved.includeClock });
          } catch (error) {
            // Prompt assembly must never fail because a profile file went bad.
            warnOnce('render', `cannot render the ambient section: ${shortReason(error)}`);
            return '';
          }
        },
      });
      return () => void dispose();
    }, 'dsh-softshell: place/time section');
  }

  for (const tool of buildTools(resolved)) ctx.tools.register(tool);

  console.error(
    `[dsh-softshell] profile=${resolved.profilePath} place=${initial.place ?? '(none)'} ` +
      `timeZone=${initial.timeZone ?? '(system)'} units=${initial.units ?? 'metric'} ` +
      `clock=${resolved.includeClock ? 'on' : 'place-only'} weather=${resolved.weather ? 'on' : 'off'} ` +
      `section=${anchored ? 'registered' : 'none'}`,
  );
}
