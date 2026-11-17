// Loads a Web client plugin (the `window.__ModuleLoader__` artifact) outside a
// browser so its pure logic can be asserted. React is stubbed: components are
// never rendered, only the factory body runs and `__logic` is read back.
//
//   const { api } = loadClient('plugins/voice/client.js')
//   assert.equal(api.__logic.speakable('**hi**'), 'hi')
//
// The stub is deliberately conservative: anything the artifact touches at load
// time (document.head for injected CSS, window for the module loader) returns
// inert objects, so a plugin that writes DOM outside a component still loads.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const inert = () => ({
  dataset: {},
  style: {},
  appendChild() {},
  setAttribute() {},
  remove() {},
  querySelector() { return null; },
});

/** Minimal React: enough surface for module-scope component *definitions*. */
export function stubReact() {
  const el = (type, props, ...children) => ({ type, props, children });
  return {
    createElement: el,
    Fragment: Symbol.for('react.fragment'),
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}, () => {}],
    useReducer: (reducer, initial) => [initial, () => {}],
    useEffect: () => {},
    useLayoutEffect: () => {},
    useInsertionEffect: () => {},
    useMemo: (factory) => factory(),
    useCallback: (fn) => fn,
    useRef: (value) => ({ current: value }),
    useContext: () => ({}),
    useSyncExternalStore: (subscribe, getSnapshot) => getSnapshot(),
    memo: (component) => component,
    forwardRef: (component) => component,
    createContext: (value) => ({ Provider: null, Consumer: null, _value: value, _currentValue: value }),
    startTransition: (fn) => fn(),
  };
}

/**
 * Evaluate one client bundle.
 * @param {string} file - path to the built client artifact (`client.js`).
 * @param {{globals?: Record<string, unknown>}} [options] - extra sandbox globals.
 * @returns {{api: any, registration: any, sandbox: any}}
 */
export function loadClient(file, options = {}) {
  const registrations = [];
  const sandbox = {
    window: { __ModuleLoader__: { load: (registration) => registrations.push(registration) } },
    document: {
      createElement: inert,
      head: inert(),
      body: inert(),
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener() {},
      removeEventListener() {},
    },
    navigator: { language: 'en-AU', userAgent: 'node' },
    localStorage: {
      _m: new Map(),
      getItem(k) { return this._m.get(k) ?? null; },
      setItem(k, v) { this._m.set(k, String(v)); },
      removeItem(k) { this._m.delete(k); },
    },
    console,
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    Intl,
    Date,
    JSON,
    Math,
    Map,
    Set,
    WeakMap,
    Symbol,
    Promise,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    cancelAnimationFrame: clearTimeout,
    ...options.globals,
  };
  const context = vm.createContext(sandbox);
  const react = stubReact();
  const jsxRuntime = { jsx: react.createElement, jsxs: react.createElement, Fragment: react.Fragment };
  // The module table only ever hands a plugin baseline dependencies; anything
  // outside it is a stub, which keeps the harness honest about what the browser
  // provides.
  const require = (name) => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime' || name === 'react/jsx-dev-runtime') return jsxRuntime;
    if (options.modules && name in options.modules) return options.modules[name];
    return {};
  };

  vm.runInContext(readFileSync(file, 'utf8'), context, { filename: file });
  if (registrations.length !== 1) {
    throw new Error(`${file}: expected one __ModuleLoader__ registration, got ${registrations.length}`);
  }
  const registration = registrations[0];
  const api = registration.factory(require);
  return { api, registration, sandbox };
}
