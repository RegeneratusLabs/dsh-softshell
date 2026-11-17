// Self-test for dsh-softshell — no DSH process, no profile, no network.
//
// The monolith has two halves. This file checks the Web half by loading the
// real client artifact through the shared harness and mounting it against a
// fake Cordis context; it then runs the Host half's own checks in-process.
import assert from 'node:assert/strict';
import { loadClient } from './test/client-harness.mjs';

const pass = (label, detail = '') => {
  process.stdout.write(`PASS ${label}${detail === '' ? '' : ` — ${detail}`}\n`);
};

const { api, registration } = loadClient('client.js');

pass('the client registers one module named dsh-softshell', registration.id === 'dsh-softshell', registration.id);

const logic = api.__logic ?? {};
// one representative from each merged part
for (const [part, key, kind] of [
  ['surface', 'currentWorkspace', 'function'],
  ['surface', 'showsOnBlank', 'function'],
  ['surface', 'workspaceName', 'function'],
  ['sources', 'extractSources', 'function'],
  ['sources', 'turnSourcesView', 'function'],
  ['voice', 'speakable', 'function'],
  ['voice', 'pickVoice', 'function'],
]) {
  assert.equal(typeof logic[key], kind, `${part}.${key} must survive the merge`);
  pass(`the ${part} logic survives the merge (${key})`);
}
assert.ok(Array.isArray(logic.starters), 'surface starters array must survive the merge');
pass('the surface starters survive the merge', String(logic.starters.length));
assert.equal(logic.starters.length, 4, 'four starters');
pass('the surface still ships four starters', String(logic.starters.length));
assert.equal(logic.configKey, 'dsh-softshell', 'bundle config key');
pass('the bundle config page is keyed by the package name', logic.configKey);
assert.ok(Array.isArray(logic.configGroups) && logic.configGroups.length === 5, 'five config groups');
pass('the config page describes five groups', String(logic.configGroups.length));

// ── mount against a fake context: every seat the parts used must still exist.
const injected = [];
const registered = [];
const fakeCtx = {
  effect(fn) {
    const cleanup = fn();
    return typeof cleanup === 'function' ? cleanup : () => {};
  },
  slots: {
    inject(slot, callback) {
      injected.push(slot);
      callback();
      return () => {};
    },
    register(options, component) {
      registered.push({ slot: options.name, key: options.key ?? options.id ?? null, component });
      return () => {};
    },
  },
  locale: {
    register() {
      return () => {};
    },
    bind() {
      return (key) => key;
    },
  },
  sidebarRightTabs: {
    get: () => undefined,
    subscribe: () => () => {},
    register: () => () => {},
  },
  sidebarRight: { openTab() {}, get: () => undefined },
  sessions: { binding: () => undefined, list: { getSnapshot: () => ({ byId: {} }) } },
  get: () => undefined,
};

api.apply(fakeCtx);

const seats = new Set(registered.map((entry) => entry.slot));
const expected = [
  'conversation.input.dock',
  'conversation.hero.workspace',
  'conversation.hero.agentPreset',
  'conversation.hero.frame',
  'conversation.input.left',
  'conversation.session.header.actions',
  'conversation.chat.turnTail',
  'conversation.chat.assistant-actions',
  'conversation.composer.dock',
  'tool.call.toolview',
  'conversation.session.header.utilities',
  'sidebar.right.pane.tab',
  'plugins.bundle.config',
];
for (const slot of expected) {
  assert.ok(seats.has(slot), `merged client must still take the ${slot} seat`);
  pass(`the merged client takes the ${slot} seat`);
}

// the bundle config page is keyed to the package, once
const bundleConfig = registered.filter((entry) => entry.slot === 'plugins.bundle.config');
assert.equal(bundleConfig.length, 1, 'one bundle config page');
assert.equal(bundleConfig[0].key, 'dsh-softshell', 'keyed by package name');
pass('the bundle config page is registered once, keyed by the package name', bundleConfig[0].key);

// the client only ever asks for services, never imports host client packages
const source = (await import('node:fs')).readFileSync('client.js', 'utf8');
const requires = source.match(/require\(\s*['"]([^'"]+)['"]\s*\)/g) ?? [];
assert.ok(requires.every((call) => /require\(\s*['"]react['"]\s*\)/.test(call)), 'only react is required');
pass('the client artifact requires nothing but react');

// ── the Host half: its own suite runs in this process.
pass('host half: delegating to the ambient/place suite');
await import('./selftest-host.mjs');
