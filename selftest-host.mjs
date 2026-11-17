/**
 * Self-test for dsh-softshell — no DSH process, no profile, no network.
 *
 * Covers the parts that fail silently: the exact one-line prompt section and
 * its 300-char cap, the "nothing to say → register nothing" rule, the state
 * file's permissions and atomic rewrite, corrupt-file tolerance, IANA time zone
 * rejection, the Open-Meteo URL builders, unit symbols, and the promise that a
 * failed weather call is a plain "Weather unavailable: …" string rather than a
 * thrown tool error. `globalThis.fetch` is stubbed, so nothing leaves the host.
 *
 * Run: node plugins/ambient/selftest.mjs
 */
import { mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const home = mkdtempSync(path.join(os.tmpdir(), 'dsh-softshell-selftest-'));
process.env.DSH_HOME = home;

const {
  apply,
  renderSection,
  formatWeather,
  readProfile,
  writeProfile,
  geocodeUrl,
  forecastUrl,
  clearWeatherCache,
} = await import('./index.js');

const profileFile = path.join(home, 'ambient', 'profile.json');
const profileDir = path.join(home, 'ambient');

let failures = 0;
/** Record one assertion; PASS lines are the test's output contract. */
function check(label, condition, detail = '') {
  if (condition) {
    process.stdout.write(`PASS ${label}\n`);
    return;
  }
  failures += 1;
  process.stdout.write(`FAIL ${label}${detail ? ` — ${detail}` : ''}\n`);
}

// Host logs are noise here; capturing them also makes "one warning" countable.
const logs = [];
const originalWarn = console.warn;
const originalError = console.error;
console.warn = (...args) => logs.push(['warn', args.join(' ')]);
console.error = (...args) => logs.push(['error', args.join(' ')]);

/** A fake Cordis context exposing only what the plugin uses. */
function fakeCtx() {
  const sections = [];
  const tools = [];
  const ctx = {
    systemPrompt: {
      getSectionOrder: (orderName) => {
        if (orderName !== 'DEPLOYMENT_PERSONA_PREFIX') throw new Error(`unexpected order name: ${orderName}`);
        return 0;
      },
      section: (section) => {
        sections.push(section);
        return () => {};
      },
    },
    tools: {
      register: (tool) => {
        tools.push(tool);
        return () => {};
      },
    },
    effect: (callback) => callback(),
  };
  return { ctx, sections, tools };
}

/** Find a captured tool by model-facing name. */
function toolNamed(tools, name) {
  return tools.find((tool) => tool.name === name);
}

/** The model-facing text a tool returns for one canonical value. */
function renderedText(tool, args, value) {
  return tool.output.render(args, value)[0].text;
}

const fixedClock = new Date('2026-11-17T16:26:00Z');
const sample = { place: 'Testville', region: 'Example Region', timeZone: 'Europe/Berlin', units: 'metric', name: 'Alex' };
const realFetch = globalThis.fetch;

try {
  // ── the section is one exact line, deterministic for a fixed clock ────────
  {
    const expected =
      'Right now: Tuesday 17 November 2026, 5:26 pm — Testville, Example Region (Europe/Berlin). Address the user as Alex.';
    const text = renderSection(sample, fixedClock);
    check('section text for a fixed injected clock', text === expected, text);
    check('section with a place is one line', !text.includes('\n'), JSON.stringify(text));
  }

  {
    const long = { place: 'X'.repeat(400), region: 'Y'.repeat(400), timeZone: 'UTC', name: 'Z'.repeat(400) };
    const text = renderSection(long, fixedClock);
    check('section is capped at 300 characters', text.length === 300 && text.endsWith('…'), `${text.length} chars`);
  }

  // ── registration: nothing to say means no section, tools still registered ─
  rmSync(profileDir, { recursive: true, force: true });
  {
    const suite = fakeCtx();
    apply(suite.ctx, {});
    check('no section when the profile is empty and includeClock is false', suite.sections.length === 0, String(suite.sections.length));
    check('tools are registered even with no profile', suite.tools.length === 2, String(suite.tools.length));
    check('a missing profile is reported as missing, not as an error', readProfile(profileFile).missing === true);
  }

  {
    const suite = fakeCtx();
    apply(suite.ctx, { includeClock: true, timeZone: 'Europe/Berlin' });
    check('clock-only section is registered when includeClock is true', suite.sections.length === 1, String(suite.sections.length));
    const section = suite.sections[0] ?? {};
    check('section name is unique and at the persona order', section.name === 'deployment:ambient' && section.order === 0, `${section.name}@${section.order}`);
    check('section never interpolates', section.interpolate === false);
    const body = typeof section.text === 'function' ? section.text({}) : '';
    check(
      'clock-only section names the zone and no place',
      body.startsWith('Right now: ') && body.includes('(Europe/Berlin)') && !body.includes(' — '),
      body,
    );
  }

  // ── profile roundtrip, atomic write, 0600/0700 ────────────────────────────
  {
    writeProfile(profileFile, sample);
    const loaded = readProfile(profileFile);
    check(
      'profile roundtrip',
      loaded.missing !== true &&
        loaded.error === undefined &&
        loaded.profile.place === 'Testville' &&
        loaded.profile.region === 'Example Region' &&
        loaded.profile.timeZone === 'Europe/Berlin' &&
        loaded.profile.units === 'metric' &&
        loaded.profile.name === 'Alex' &&
        typeof loaded.profile.updatedAt === 'string',
      JSON.stringify(loaded.profile),
    );
    const dirMode = statSync(profileDir).mode & 0o777;
    const fileMode = statSync(profileFile).mode & 0o777;
    check('profile directory is 0700', dirMode === 0o700, dirMode.toString(8));
    check('profile file is 0600', fileMode === 0o600, fileMode.toString(8));
  }

  // ── a corrupt file warns once, registers no section, never fails boot ────
  {
    writeFileSync(profileFile, '{ this is not json');
    const before = logs.length;
    const suite = fakeCtx();
    let booted = true;
    try {
      apply(suite.ctx, {});
    } catch {
      booted = false;
    }
    const warnings = logs.slice(before).filter(([kind, text]) => kind === 'warn' && text.includes('[dsh-softshell]'));
    check('corrupt profile never fails boot', booted);
    check('corrupt profile warns exactly once', warnings.length === 1, `${warnings.length} warning(s)`);
    check('corrupt profile registers no section', suite.sections.length === 0, String(suite.sections.length));
    check('corrupt profile still registers the tools', suite.tools.length === 2, String(suite.tools.length));
  }

  // ── ambient_place: set / get / unknown fields / invalid zone ─────────────
  {
    const suite = fakeCtx();
    apply(suite.ctx, {});
    const tool = toolNamed(suite.tools, 'ambient_place');
    check('ambient_place is registered', tool !== undefined);

    const set = await tool.execute({ action: 'set', ...sample }, {});
    check(
      'ambient_place set recovers a corrupt file and stores the profile',
      renderedText(tool, {}, set).includes('place: Testville') && readProfile(profileFile).profile.name === 'Alex',
      renderedText(tool, {}, set),
    );

    const invalidZone = { place: 'Testville', timeZone: 'Mars/Olympus_Mons' };
    const rejectedZone = await tool.execute({ action: 'set', ...invalidZone }, {});
    check(
      'ambient_place rejects an invalid IANA time zone',
      renderedText(tool, invalidZone, rejectedZone).includes('not a valid IANA time zone') &&
        readProfile(profileFile).profile.timeZone === 'Europe/Berlin',
      renderedText(tool, invalidZone, rejectedZone),
    );

    const unknown = { action: 'set', country: 'AU' };
    const rejectedUnknown = await tool.execute(unknown, {});
    check(
      'ambient_place rejects unknown fields instead of dropping them',
      renderedText(tool, unknown, rejectedUnknown).includes('unknown field') &&
        readProfile(profileFile).profile.place === 'Testville',
      renderedText(tool, unknown, rejectedUnknown),
    );

    const got = await tool.execute({ action: 'get' }, {});
    const gotText = renderedText(tool, { action: 'get' }, got);
    check(
      'ambient_place get returns the stored profile as text',
      gotText.includes('place: Testville') && gotText.includes('region: Example Region') && gotText.includes('name: Alex'),
      gotText,
    );
  }

  // ── URL builders ─────────────────────────────────────────────────────────
  {
    const place = 'Testville Example Region & Co';
    const geo = geocodeUrl(place);
    check(
      'geocode URL encodes the place',
      geo.startsWith('https://geocoding-api.open-meteo.com/v1/search?') &&
        geo.includes(`name=${encodeURIComponent(place)}`) &&
        geo.includes('count=1') &&
        geo.includes('format=json'),
      geo,
    );

    const imperial = forecastUrl({ latitude: -24.5, longitude: 133.5, days: 2, units: 'imperial' });
    check(
      'forecast URL encodes coordinates and units',
      imperial.includes('latitude=-24.5') &&
        imperial.includes('longitude=133.5') &&
        imperial.includes('temperature_unit=fahrenheit') &&
        imperial.includes('wind_speed_unit=mph') &&
        imperial.includes('forecast_days=2'),
      imperial,
    );

    const currentOnly = forecastUrl({ latitude: 0, longitude: 0, days: 0, units: 'metric' });
    check(
      'forecast URL drops the daily block for days=0',
      !currentOnly.includes('daily=') && currentOnly.includes('temperature_unit=celsius') && currentOnly.includes('wind_speed_unit=kmh'),
      currentOnly,
    );
  }

  // ── formatWeather prints the right unit symbol ───────────────────────────
  const metricPayload = {
    timezone: 'Europe/Berlin',
    current: { temperature_2m: 22.4, apparent_temperature: 23.1, relative_humidity_2m: 65, weather_code: 1, wind_speed_10m: 12.3 },
    daily: {
      time: ['2026-11-17', '2026-11-18'],
      weather_code: [1, 61],
      temperature_2m_max: [26.1, 23.0],
      temperature_2m_min: [15.2, 14.8],
      precipitation_probability_max: [10, 80],
    },
  };
  {
    const text = formatWeather(metricPayload, sample);
    check(
      'formatWeather prints metric temperature and wind',
      text.includes('Testville, Example Region') &&
        text.includes('22°C') &&
        text.includes('12 km/h') &&
        text.includes('15–26°C') &&
        text.includes('Today:') &&
        text.includes('Tomorrow:'),
      text,
    );
  }
  {
    const imperialPayload = {
      current: { temperature_2m: 72.4, apparent_temperature: 74.0, relative_humidity_2m: 60, weather_code: 61, wind_speed_10m: 7.6 },
      daily: { time: ['2026-11-17'], temperature_2m_max: [79.0], temperature_2m_min: [59.4], precipitation_probability_max: [80] },
    };
    const text = formatWeather(imperialPayload, { ...sample, units: 'imperial' });
    check(
      'formatWeather prints imperial temperature and wind',
      text.includes('72°F') && text.includes('8 mph') && text.includes('59–79°F') && text.includes('80% rain'),
      text,
    );
  }

  // ── weather tool: never throws, degrades to a plain string ───────────────
  {
    const suite = fakeCtx();
    apply(suite.ctx, {});
    const tool = toolNamed(suite.tools, 'ambient_weather');
    check('ambient_weather is registered', tool !== undefined);

    clearWeatherCache();
    globalThis.fetch = async () => {
      throw new Error('network down');
    };
    let result;
    let threw = false;
    try {
      result = await tool.execute({ days: 0 }, {});
    } catch {
      threw = true;
    }
    const text = result ? renderedText(tool, { days: 0 }, result) : '';
    check(
      'weather failure is a plain "Weather unavailable" string, never a throw',
      !threw && typeof text === 'string' && text.startsWith('Weather unavailable: ') && !text.includes('\n'),
      text,
    );
    check('weather failure names a short reason', text.includes('network down'), text);
  }

  // ── weather tool: configured coordinates, units and the coordinate cache ─
  {
    clearWeatherCache();
    const suite = fakeCtx();
    apply(suite.ctx, { place: 'Testville', region: 'Example Region', timeZone: 'Europe/Berlin', lat: -24.5, lon: 133.5 });
    const tool = toolNamed(suite.tools, 'ambient_weather');
    const fetched = [];
    globalThis.fetch = async (url) => {
      fetched.push(String(url));
      return { ok: true, status: 200, json: async () => metricPayload };
    };

    const first = await tool.execute({ days: 1 }, {});
    const second = await tool.execute({ days: 1 }, {});
    globalThis.fetch = realFetch;

    check(
      'weather uses configured coordinates instead of geocoding',
      fetched.length === 1 && fetched[0].includes('latitude=-24.5') && fetched[0].includes('longitude=133.5'),
      fetched.join(', '),
    );
    check('weather result carries the metric symbol', renderedText(tool, { days: 1 }, first).includes('22°C'));
    check(
      'weather caches by coordinates for ten minutes',
      fetched.length === 1 && renderedText(tool, { days: 1 }, first) === renderedText(tool, { days: 1 }, second),
      `${fetched.length} fetch(es) for two calls`,
    );
  }

  // ── weather:false leaves only the place tool ─────────────────────────────
  {
    const suite = fakeCtx();
    apply(suite.ctx, { weather: false });
    check(
      'weather:false registers ambient_place only',
      suite.tools.length === 1 && suite.tools[0].name === 'ambient_place',
      suite.tools.map((tool) => tool.name).join(', '),
    );
  }
} finally {
  console.warn = originalWarn;
  console.error = originalError;
  globalThis.fetch = realFetch;
  rmSync(home, { recursive: true, force: true });
}

process.stdout.write(failures === 0 ? '\nPASS ALL SELFTESTS PASSED\n' : `\nFAIL ${failures} assertion(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);
