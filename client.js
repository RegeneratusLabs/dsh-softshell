/**
 * Softshell — one package carrying every personal-surface change for the Web
 * client. It is the monolith build: the home surface, the sources surfaces and
 * read-aloud are merged here, each in its own function scope so their locals
 * cannot collide, and the bundle's configuration page is mounted beside them.
 *
 * Why one artifact: a package's Web entry is keyed by its package name, so a
 * single package gets exactly one client module. Splitting the features into
 * separately switchable rows would mean one package per feature; this build
 * keeps the install to one spec and grows a configuration page instead.
 *
 * The parts are generated from the original artifacts (`plugins/home`,
 * `plugins/search-ui`, `plugins/voice`); edit those first while they still
 * exist, then regenerate, so the merge stays mechanical.
 */
window.__ModuleLoader__.load({
  id: 'dsh-softshell',
  factory(require) {
    // The wrapper's own config page needs React; each merged part declares its
    // own `React`/`h` inside its function scope, so these do not collide.
    const React = require('react');
    const h = React.createElement;

    /* ── home surface: starters, hero seats, workspace chip ─────────────── */
    const surface = (function (require) {

    const React = require('react');
    const h = React.createElement;
    const { useEffect, useRef, useState } = React;

    /** The list slot the starters occupy: session scope, blank-session screen. */
    const SLOT = 'conversation.input.dock';
    /** Registration identity within that list. */
    const ENTRY_ID = 'dsh-home';
    /** Class names are prefixed because the injected stylesheet is global. */
    const ROOT = 'dsh-home-starters';
    const BUTTON = 'dsh-home-starters__button';
    const ICON = 'dsh-home-starters__icon';
    const LABEL = 'dsh-home-starters__label';
    /** Hero selectors this plugin hides: the workspace picker moves into the composer. */
    const HERO_WORKSPACE = 'conversation.hero.workspace';
    const HERO_PRESET = 'conversation.hero.agentPreset';
    /**
     * The hero frame wrapper. The Host draws its Workspace trigger inside the
     * composer-chain entry (not through a slot), so the only seam that reaches
     * it is this HOC: one scoped rule keyed on the control's accessible name.
     * If the Host renames it the rule simply stops matching and the control
     * comes back — it can never break the row.
     */
    const HERO_FRAME = 'conversation.hero.frame';
    const HERO_SCOPE = 'dsh-home-hero';
    /** Turn-tail seat the shipped changes card occupies; we take the cell and render nothing. */
    const TURN_TAIL = 'conversation.chat.turnTail';
    const CHANGES_CARD_ID = '@deepseek-ai/dsh-client-ui-deliverables';
    /** Composer-dock cells that report turns, tokens and cache behaviour. */
    const COMPOSER_DOCK = 'conversation.composer.dock';
    const DOCK_PILL_IDS = ['activity', 'usage'];
    /** Header seat of the agent-preset label ("Standard mode"). */
    const HEADER_ACTIONS = 'conversation.session.header.actions';
    const PRESET_LABEL_ID = 'agent-preset';
    /** Composer tool-row seat the folder chip takes (beside the attach button). */
    const INPUT_LEFT = 'conversation.input.left';
    const WS_ENTRY_ID = 'dsh-home-workspace';
    const WS_ROOT = 'dsh-home-ws';
    const WS_BUTTON = 'dsh-home-ws__button';
    const WS_MENU = 'dsh-home-ws__menu';
    const WS_ITEM = 'dsh-home-ws__item';
    const WS_ITEM_ON = 'dsh-home-ws__item--current';
    const WS_LABEL = 'dsh-home-ws__label';
    const WS_ITEM_TITLE = 'dsh-home-ws__title';
    const WS_ITEM_PATH = 'dsh-home-ws__path';
    /** Idempotency marker for the injected stylesheet. */
    const STYLE_ATTR = 'data-dsh-home-styles';

    /**
     * The four starters, personal rather than coding.
     *
     * The prompts are the user's words, kept plain: each names the outcome, not
     * the machinery. Ids are stable because they key the rendered buttons.
     */
    const STARTERS = Object.freeze([
      Object.freeze({
        id: 'brief',
        icon: 'brief',
        label: 'Brief me',
        prompt:
          'Give me a short brief for today: what is on, what needs a decision, and what I might be forgetting.',
      }),
      Object.freeze({
        id: 'due',
        icon: 'due',
        label: "What's due?",
        prompt:
          'What is due, expiring or missing, and which of those actually needs a decision from me?',
      }),
      Object.freeze({
        id: 'weather',
        icon: 'weather',
        label: 'Weather',
        prompt:
          'What is the weather where I am today, and does anything I have planned need to change?',
      }),
      Object.freeze({
        id: 'reply',
        icon: 'reply',
        label: 'Draft a reply',
        prompt:
          'I need to reply to a message. Ask me who it is from and what they said, then draft a short reply I can edit.',
      }),
    ]);

    /** The stylesheet: a centered row of suggestion pills, a 2×2 grid on phones. */
    const CSS = `
.${ROOT} {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 0 4px 10px;
  min-width: 0;
  box-sizing: border-box;
}
.${BUTTON} {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  box-sizing: border-box;
  height: 34px;
  margin: 0;
  padding: 0 14px;
  border: 1px solid var(--dsw-alias-border-l4, rgba(127, 127, 127, 0.4));
  border-radius: 999px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b7280);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}
@media (hover: hover) {
  .${BUTTON}:hover {
    background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.14));
    border-color: var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.5));
    color: var(--dsw-alias-label-primary, #111827);
  }
}
.${BUTTON}:focus-visible {
  outline: 2px solid var(--dsw-alias-label-primary, #111827);
  outline-offset: 2px;
}
.${ICON} {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
}
.${LABEL} {
  min-width: 0;
  color: inherit;
  white-space: nowrap;
}
.${WS_ROOT} {
  position: relative;
  display: inline-flex;
  min-width: 0;
}
.${WS_BUTTON} {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 190px;
  height: 28px;
  margin: 0;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b7280);
  font-family: inherit;
  font-size: 12.5px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 120ms ease, color 120ms ease;
}
@media (hover: hover) {
  .${WS_BUTTON}:hover {
    background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.12));
    color: var(--dsw-alias-label-primary, #111827);
  }
}
.${WS_BUTTON}:focus-visible {
  outline: 2px solid var(--dsw-alias-label-primary, #111827);
  outline-offset: 2px;
}
.${WS_LABEL} {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${WS_MENU} {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  min-width: 240px;
  max-width: 320px;
  max-height: 280px;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.35));
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-layer-1, #ffffff);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
}
.${WS_ITEM} {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  padding: 7px 9px;
  border: 0;
  border-radius: var(--dsw-radius-sm, 6px);
  background: transparent;
  color: var(--dsw-alias-label-primary, #111827);
  font-family: inherit;
  font-size: 12.5px;
  line-height: 1.3;
  text-align: left;
  cursor: pointer;
}
@media (hover: hover) {
  .${WS_ITEM}:hover {
    background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.12));
  }
}
.${WS_ITEM}:focus-visible {
  outline: 2px solid var(--dsw-alias-label-primary, #111827);
  outline-offset: -2px;
}
.${WS_ITEM_ON} {
  background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.1));
}
.${WS_ITEM_TITLE} {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${WS_ITEM_PATH} {
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 639px) {
  .${ROOT} {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding: 0 0 8px;
  }
  .${BUTTON} {
    justify-content: flex-start;
    height: 44px;
    padding: 0 12px;
    border-radius: var(--dsw-radius-md, 8px);
    white-space: normal;
  }
  .${LABEL} {
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .${WS_BUTTON} {
    max-width: 132px;
  }
  .${WS_LABEL} {
    display: none;
  }
}
.${HERO_SCOPE} {
  display: contents;
}
.${HERO_SCOPE} [aria-label='Choose workspace'] {
  display: none;
}
/*
 * Host-drawn chrome that has no slot to replace: the extra conversation Views
 * (Trajectory), the model picker, and the per-session access-mode picker. Each
 * rule is keyed on a semantic attribute the Host renders, so a rename simply
 * brings the control back instead of breaking the surface. The access mode and
 * model are still chosen in Settings.
 */
[data-conversation-tabs] > button[role='tab']:not(:first-child) {
  display: none !important;
}
button[aria-label^='Select model'] {
  display: none !important;
}
button[aria-label^='Access mode'] {
  display: none !important;
}
button[aria-label='More conversation views'] {
  display: none !important;
}
button[aria-label$='of context used'] {
  display: none !important;
}
button[aria-label='Branch into a new conversation'] {
  display: none !important;
}`;

    /* ------------------------------------------------------------------ icons */

    /**
     * One small line icon per starter, drawn in `currentColor`.
     *
     * Inline SVG rather than a font or a host icon set: the mark must inherit
     * the button's colour in both themes and must not depend on a package this
     * plugin does not own. All four use the same 16×16 stroked geometry so the
     * row reads as one family.
     */
    function StarterIcon({ id }) {
      const common = {
        width: 15,
        height: 15,
        viewBox: '0 0 16 16',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.4,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': 'true',
        focusable: 'false',
      };
      if (id === 'due') {
        return h(
          'svg',
          common,
          h('circle', { cx: 8, cy: 8, r: 5.5 }),
          h('path', { d: 'M8 4.9V8l2.1 1.5' }),
        );
      }
      if (id === 'weather') {
        return h(
          'svg',
          common,
          h('circle', { cx: 8, cy: 8, r: 2.9 }),
          h('path', { d: 'M8 1.6v1.5M8 12.9v1.5M1.6 8h1.5M12.9 8h1.5M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M12.5 3.5l-1.1 1.1M4.6 11.4l-1.1 1.1' }),
        );
      }
      if (id === 'reply') {
        return h(
          'svg',
          common,
          h('rect', { x: 2.3, y: 4, width: 11.4, height: 8.4, rx: 1.4 }),
          h('path', { d: 'M2.8 4.6 8 8.6l5.2-4' }),
        );
      }
      // 'brief' — a short list, the shape of the answer the starter asks for.
      return h(
        'svg',
        common,
        h('path', { d: 'M3 4.2h10M3 8h10M3 11.8h6' }),
      );
    }

    /* --------------------------------------------------------------- behaviour */

    /**
     * Whether a slot prop is the public input action face.
     *
     * The facade is the host's; this plugin only needs the two verbs it calls.
     * A partial or absent face is treated as absent so the list stays invisible
     * rather than throwing inside the hero.
     * @param value - the `inputActions` prop, possibly absent.
     * @returns whether both verbs are callable.
     */
    function hasInputFace(value) {
      return (
        value !== null &&
        typeof value === 'object' &&
        typeof value.setDraft === 'function' &&
        typeof value.submit === 'function'
      );
    }

    /**
     * Fill the composer with one starter and send it.
     *
     * Draft first, then submit, so the user sees the prompt land before it
     * sends and an ordinary message is what reaches the Host. Returns whether
     * the click was acted on, which the tests pin.
     * @param inputActions - the session-scope input face prop.
     * @param starter - one entry of {@link STARTERS}.
     * @returns true when the prompt was written and submitted.
     */
    function activate(inputActions, starter) {
      if (!hasInputFace(inputActions) || !starter || typeof starter.prompt !== 'string') return false;
      inputActions.setDraft(starter.prompt);
      inputActions.submit();
      return true;
    }

    /* ------------------------------------------------------------- components */

    /**
     * The starter list, as rendered inside the hero's New Session row.
     * @param props - session-scope standard props; only `inputActions` is used.
     * @returns the grid, or null when the host supplies no input face.
     */
    /** @returns whether the suggestion row belongs on this session snapshot. */
    function showsOnBlank(session) {
      return Boolean(session) && session.blank === true;
    }

    function Starters({ inputActions, session }) {
      if (!hasInputFace(inputActions)) return null;
      // Suggestions belong to a new conversation only; the dock is resident, so
      // this is the gate that keeps them out of every later turn.
      if (!showsOnBlank(session)) return null;
      return h(
        'div',
        { className: ROOT, role: 'group', 'aria-label': 'Starters' },
        STARTERS.map((starter) =>
          h(
            'button',
            {
              key: starter.id,
              type: 'button',
              className: BUTTON,
              title: starter.prompt,
              'aria-label': `${starter.label}: ${starter.prompt}`,
              onClick: () => {
                activate(inputActions, starter);
              },
            },
            h('span', { className: ICON, 'aria-hidden': 'true' }, h(StarterIcon, { id: starter.icon })),
            h('span', { className: LABEL }, starter.label),
          ),
        ),
      );
    }

    /* ------------------------------------------------------------------ loader */

    /** Inject the component stylesheet once; returns its cleanup. */

    /** Wraps the hero so the replacement picker is the only folder control. */
    function HeroFrame(props) {
      return h('div', { className: HERO_SCOPE, 'data-dsh-home-hero': 'true' }, props.children);
    }

    /** Renders nothing: a single slot is replaced by an empty occupant. */
    function Hidden() {
      return null;
    }

    /**
     * The Workspace row a chip shows, or undefined when the id is unknown.
     * @param {unknown} items - `WorkspaceSnapshot.items`.
     * @param {unknown} workspaceId - the current Workspace id.
     * @returns {object|undefined} the matching row.
     */
    /**
     * A Workspace name worth showing: its title, else a spaced basename.
     * @param {unknown} workspace - one Workspace row.
     * @returns {string|undefined} the display name.
     */
    function workspaceName(workspace) {
      if (!workspace || typeof workspace !== 'object') return undefined;
      const title = typeof workspace.title === 'string' ? workspace.title.trim() : '';
      if (title !== '' && !/^[a-z0-9._-]+$/.test(title)) return title;
      const source = title !== '' ? title : typeof workspace.path === 'string' ? workspace.path.split('/').filter(Boolean).pop() ?? '' : '';
      if (source === '') return undefined;
      return source
        .split(/[-_]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    function currentWorkspace(items, workspaceId) {
      if (!Array.isArray(items) || typeof workspaceId !== 'string') return undefined;
      return items.find((item) => item && item.workspaceId === workspaceId);
    }

    /**
     * Whether picking a Workspace would change the current one.
     * @param {unknown} currentId - the Workspace the turn would run in.
     * @param {unknown} nextId - the Workspace the person clicked.
     * @returns {boolean} true when the click switches.
     */
    function shouldSwitch(currentId, nextId) {
      return typeof nextId === 'string' && nextId !== '' && nextId !== currentId;
    }

    /** A folder glyph drawn in currentColor. */
    function FolderGlyph() {
      return h(
        'svg',
        { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('path', {
          d: 'M2.2 4.6c0-.7.5-1.2 1.2-1.2h2.4l1.2 1.4h5.6c.7 0 1.2.5 1.2 1.2v5.4c0 .7-.5 1.2-1.2 1.2H3.4c-.7 0-1.2-.5-1.2-1.2z',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinejoin: 'round',
        }),
      );
    }

    /**
     * The folder chip that replaces the hero Workspace picker: it names the
     * Workspace the next turn will run in and opens a short list to change it.
     */
    function WorkspaceChip({ sessionId, useSessions, useWorkspaces, pick }) {
      const [open, setOpen] = useState(false);
      const rootRef = useRef(null);
      const rawItems = useWorkspaces((snapshot) => snapshot?.items);
      const items = Array.isArray(rawItems) ? rawItems.filter((item) => item && typeof item.workspaceId === 'string') : undefined;
      // The Host resolves a session's Workspace by membership in `sessionIds`,
      // not by a field on the session row; mirror that, then fall back to the
      // first Workspace so a brand-new session still names one.
      const current = useWorkspaces((snapshot) => {
        const list = snapshot?.items;
        if (!Array.isArray(list)) return undefined;
        const own = list.find(
          (item) => item && Array.isArray(item.sessionIds) && item.sessionIds.includes(sessionId),
        );
        return own ?? list[0];
      });
      const workspaceId = current?.workspaceId;
      const title = workspaceName(current);

      useEffect(() => {
        if (!open) return undefined;
        const onKey = (event) => {
          if (event.key === 'Escape') setOpen(false);
        };
        const onPointer = (event) => {
          const root = rootRef.current;
          if (root && typeof root.contains === 'function' && !root.contains(event.target)) setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onPointer, true);
        return () => {
          document.removeEventListener('keydown', onKey);
          document.removeEventListener('pointerdown', onPointer, true);
        };
      }, [open]);

      if (!Array.isArray(items) || items.length === 0) return null;
      const label = title ?? 'Choose workspace';

      return h(
        'div',
        { className: WS_ROOT, ref: rootRef },
        h(
          'button',
          {
            type: 'button',
            className: WS_BUTTON,
            'aria-haspopup': 'menu',
            'aria-expanded': open ? 'true' : 'false',
            'aria-label': `Workspace: ${label}`,
            title: current && typeof current.path === 'string' ? current.path : label,
            onClick: () => setOpen((value) => !value),
          },
          h(FolderGlyph, null),
          h('span', { className: WS_LABEL }, label),
        ),
        open
          ? h(
              'div',
              { className: WS_MENU, role: 'menu', 'aria-label': 'Workspaces' },
              items.map((item) =>
                h(
                  'button',
                  {
                    key: item.workspaceId,
                    type: 'button',
                    role: 'menuitemradio',
                    'aria-checked': item.workspaceId === workspaceId ? 'true' : 'false',
                    className:
                      item.workspaceId === workspaceId ? `${WS_ITEM} ${WS_ITEM_ON}` : WS_ITEM,
                    onClick: () => {
                      setOpen(false);
                      if (shouldSwitch(workspaceId, item.workspaceId)) pick(item.workspaceId);
                    },
                  },
                  h('span', { className: WS_ITEM_TITLE }, workspaceName(item) || item.workspaceId),
                  h('span', { className: WS_ITEM_PATH }, item.path || ''),
                ),
              ),
            )
          : null,
      );
    }

    function installStyles() {
      if (typeof document === 'undefined' || document.head === undefined || document.head === null) {
        return () => {};
      }
      if (typeof document.querySelector === 'function' && document.querySelector(`style[${STYLE_ATTR}]`) !== null) {
        return () => {};
      }
      const tag = document.createElement('style');
      tag.setAttribute(STYLE_ATTR, '');
      tag.dataset.plugin = '@local/dsh-home';
      tag.textContent = CSS;
      document.head.appendChild(tag);
      return () => {
        if (typeof tag.remove === 'function') tag.remove();
      };
    }

    /**
     * Register the starter list with the Conversation hero.
     * @param ctx - client Cordis context carrying the `slots` service.
     */
    function apply(ctx) {
      ctx.effect(() => installStyles(), 'dsh-home: starter styles');
      ctx.slots.inject(SLOT, () =>
        ctx.slots.register(
          { name: SLOT, id: ENTRY_ID, order: 0 },
          Starters,
        ),
      );

      // A single slot is shadowed by a dynamically registered entry, so an empty
      // occupant removes the shipped control without touching the host.
      // The per-turn "Edited N files" diff card is a deliverables contribution.
      // List cells are keyed by id, so reusing the shipped id replaces it.
      // The performance pills under the composer are named dock cells.
      for (const id of DOCK_PILL_IDS) {
        ctx.slots.inject(COMPOSER_DOCK, () =>
          ctx.slots.register({ name: COMPOSER_DOCK, id, order: 100, priority: -1 }, Hidden),
        );
      }
      // The agent-preset label in the session header is a named list cell too.
      ctx.slots.inject(HEADER_ACTIONS, () =>
        ctx.slots.register({ name: HEADER_ACTIONS, id: PRESET_LABEL_ID, order: -10, priority: -1 }, Hidden),
      );
      ctx.slots.inject(TURN_TAIL, () =>
        ctx.slots.register({ name: TURN_TAIL, id: CHANGES_CARD_ID, order: 100, priority: -1 }, Hidden),
      );
      ctx.slots.inject(HERO_FRAME, () =>
        ctx.slots.register({ name: HERO_FRAME, id: 'dsh-home-hero', priority: -1 }, HeroFrame),
      );
      ctx.slots.inject(HERO_WORKSPACE, () =>
        ctx.slots.register({ name: HERO_WORKSPACE, priority: -1 }, Hidden),
      );
      ctx.slots.inject(HERO_PRESET, () =>
        ctx.slots.register({ name: HERO_PRESET, priority: -1 }, Hidden),
      );

      // The Workspace picker the hero lost now lives beside the attach control.
      ctx.slots.inject(INPUT_LEFT, () =>
        ctx.slots.register({ name: INPUT_LEFT, id: WS_ENTRY_ID, order: -10 }, (props) =>
          h(WorkspaceChip, {
            ...props,
            pick: (workspaceId) => {
              const service = typeof ctx.get === 'function' ? ctx.get('uiWorkspace') : ctx.uiWorkspace;
              if (service && typeof service.openWorkspace === 'function') {
                Promise.resolve(service.openWorkspace(workspaceId)).catch(() => {});
              }
            },
          }),
        ),
      );
    }

    // The testing seam beside the Cordis surface: pure data and the click
    // contract, so the self-test can pin both without a browser or a React
    // renderer (see test/client-harness.mjs).
    const __logic = Object.freeze({
      starters: STARTERS,
      hidden: Hidden,
      shouldSwitch,
      currentWorkspace,
      workspaceName,
      WorkspaceChip,
      workspaceSlot: INPUT_LEFT,
      heroWorkspaceSlot: HERO_WORKSPACE,
      heroPresetSlot: HERO_PRESET,
      HeroFrame,
      heroFrameSlot: HERO_FRAME,
      turnTailSlot: TURN_TAIL,
      changesCardId: CHANGES_CARD_ID,
      headerActionsSlot: HEADER_ACTIONS,
      composerDockSlot: COMPOSER_DOCK,
      dockPillIds: DOCK_PILL_IDS,
      presetLabelId: PRESET_LABEL_ID,
      activate,
      hasInputFace,
      showsOnBlank,
      Starters,
      slot: SLOT,
      entryId: ENTRY_ID,
    });

    return {
      inject: ['slots'],
      apply,
      __logic,
    };
    })(require);

    /* ── sources: pane, inline rows, per-turn band ──────────────────────── */
    const sources = (function (require) {

    const React = require('react');
    const h = React.createElement;
    const { useEffect, useMemo, useState } = React;

    /** The type definition's identity: the key its body registers under. */
    const TAB_ID = '@local/dsh-search-ui';
    /** The page kind `openTab` names. A page type, opened by kind. */
    const TAB_KIND = 'search-sources';
    /** BCP-47 namespace of this plugin's copy. */
    const NS = 'dsh-search-ui';
    /** Bound on rendered cards: one session can produce a lot of links. */
    const MAX_SOURCES = 120;
    /** Tools whose calls/results can name a page this session touched. */
    const WEB_TOOLS = new Set(['web_search', 'web_fetch', 'browse', 'render_view']);

    /** Class names are prefixed: the injected stylesheet is global. */
    const ROOT = 'dsh-sources';
    const HEAD = 'dsh-sources__head';
    const HEAD_ROW = 'dsh-sources__head-row';
    const HEADING = 'dsh-sources__heading';
    const COUNT = 'dsh-sources__count';
    const META = 'dsh-sources__meta';
    const LIST = 'dsh-sources__list';
    const ITEM = 'dsh-sources__item';
    const CARD = 'dsh-sources__card';
    const AVATAR = 'dsh-sources__avatar';
    const BODY = 'dsh-sources__body';
    const LINE = 'dsh-sources__line';
    const HOST = 'dsh-sources__host';
    const WHEN = 'dsh-sources__when';
    const TITLE = 'dsh-sources__title';
    const SNIPPET = 'dsh-sources__snippet';
    const EMPTY = 'dsh-sources__empty';
    const EMPTY_GLYPH = 'dsh-sources__empty-glyph';
    const EMPTY_TITLE = 'dsh-sources__empty-title';
    const EMPTY_HINT = 'dsh-sources__empty-hint';
    const SKELETON = 'dsh-sources__skeleton';
    const SKELETON_AVATAR = 'dsh-sources__skeleton-avatar';
    const SKELETON_BODY = 'dsh-sources__skeleton-body';
    const SKELETON_LINE = 'dsh-sources__skeleton-line';
    const SKELETON_SHORT = 'dsh-sources__skeleton-line--short';
    const TRIGGER = 'dsh-sources__trigger';
    const STYLE_ATTR = 'data-dsh-search-ui-styles';

    /** Inline conversation surfaces (search/fetch rows and the per-turn strip). */
    const INLINE = 'dsh-inline';
    const INLINE_HEAD = 'dsh-inline__head';
    const INLINE_HEAD_PENDING = 'dsh-inline__head--pending';
    const INLINE_GLYPH = 'dsh-inline__glyph';
    const INLINE_LABEL = 'dsh-inline__label';
    const INLINE_QUERY = 'dsh-inline__query';
    const INLINE_MUTED = 'dsh-inline__muted';
    const INLINE_STACK = 'dsh-inline__stack';
    const INLINE_CHIP = 'dsh-inline__chip';
    const INLINE_MORE = 'dsh-inline__more';
    const INLINE_CHEV = 'dsh-inline__chev';
    const INLINE_BODY = 'dsh-inline__body';
    const INLINE_HEADING = 'dsh-inline__heading';
    const INLINE_SOURCE = 'dsh-inline__source';
    const INLINE_AVATAR = 'dsh-inline__avatar';
    const INLINE_TITLE = 'dsh-inline__title';
    const INLINE_HOST = 'dsh-inline__host';
    const INLINE_EXT = 'dsh-inline__ext';
    const INLINE_ACTIONS = 'dsh-inline__actions';
    const INLINE_LINK = 'dsh-inline__link';
    const INLINE_ERROR = 'dsh-inline__error';
    const TAIL = 'dsh-tail';
    const TAIL_ICON = 'dsh-tail__icon';
    const TAIL_LEAD = 'dsh-tail__lead';
    const TAIL_LABEL = 'dsh-tail__label';
    const TAIL_VIEW = 'dsh-tail__view';
    const TAIL_STACK = 'dsh-tail__stack';

    const en = {
      title: 'Sources',
      loading: 'Reading this session’s sources…',
      'count.aria': '{count} sources',
      'meta.join': '{searches} · {pages}',
      'meta.searches.one': '{count} search',
      'meta.searches.other': '{count} searches',
      'meta.pages.one': '{count} page read',
      'meta.pages.other': '{count} pages read',
      'empty.title': 'No searches in this session yet',
      'empty.hint': 'When a question needs the web, every search and page it reads will collect here.',
      'unavailable.title': 'This session’s log is not ready yet',
      'unavailable.hint': 'Open the tab again in a moment — the conversation loads the log it needs.',
      'trigger.aria': 'Open the Sources tab',
      'trigger.tooltip': 'Sources: what this session has read',
      'card.aria': 'Open {title} on {host}',
      'tab.guide.title': 'Sources',
      'tab.guide.description': 'Web searches and pages this session has read',
      'row.search.pending': 'Searching the web',
      'row.search.done': 'Searched the web',
      'row.search.failed': 'Search failed',
      'row.fetch.pending': 'Reading {host}',
      'row.fetch.done': 'Read {host}',
      'row.fetch.failed': 'Fetch failed',
      'row.queries': '{count} queries',
      'row.pages.one': '· {count} page',
      'row.pages.other': '· {count} pages',
      'row.dot': '·',
      'row.empty': 'This search returned no sources.',
      'row.expand': 'Show sources',
      'row.collapse': 'Hide sources',
      'row.open.aria': 'Open {title} on {host}',
      'read.heading.one': 'Read {count} page',
      'read.heading.other': 'Read {count} pages',
      'read.viewAll': 'View all {count}',
      'read.openSources': 'Open Sources',
      'tail.aria': 'Sources from this turn',
      'tail.open': 'Open Sources: {summary}',
      'tail.searched': 'Searched the web',
      'tail.searches.one': '{count} search',
      'tail.searches.other': '{count} searches',
      'tail.sources.one': '{count} source',
      'tail.sources.other': '{count} sources',
      'tail.pages.one': '{count} page read',
      'tail.pages.other': '{count} pages read',
      'tail.join': '{sources} · {pages}',
      'tail.viewAll': 'View all',
    };

    const zh = {
      title: '来源',
      loading: '正在读取本会话的来源…',
      'count.aria': '{count} 个来源',
      'meta.join': '{searches} · {pages}',
      'meta.searches.one': '{count} 次搜索',
      'meta.searches.other': '{count} 次搜索',
      'meta.pages.one': '{count} 个页面阅读',
      'meta.pages.other': '{count} 个页面阅读',
      'empty.title': '本会话还没有搜索',
      'empty.hint': '当问题需要联网时，每一次搜索和读过的页面都会收集在这里。',
      'unavailable.title': '本会话的日志尚未就绪',
      'unavailable.hint': '稍后再打开这个标签页——会话正在加载所需的日志。',
      'trigger.aria': '打开“来源”标签页',
      'trigger.tooltip': '来源：本会话读过什么',
      'card.aria': '在 {host} 上打开 {title}',
      'tab.guide.title': '来源',
      'tab.guide.description': '本会话的网页搜索与已读页面',
      'row.search.pending': '正在搜索网页',
      'row.search.done': '已搜索网页',
      'row.search.failed': '搜索失败',
      'row.fetch.pending': '正在读取 {host}',
      'row.fetch.done': '已读取 {host}',
      'row.fetch.failed': '读取失败',
      'row.queries': '{count} 条查询',
      'row.pages.one': '· {count} 个页面',
      'row.pages.other': '· {count} 个页面',
      'row.dot': '·',
      'row.empty': '这次搜索没有返回来源。',
      'row.expand': '展开来源',
      'row.collapse': '收起来源',
      'row.open.aria': '在 {host} 上打开 {title}',
      'read.heading.one': '读取了 {count} 个页面',
      'read.heading.other': '读取了 {count} 个页面',
      'read.viewAll': '查看全部 {count}',
      'read.openSources': '打开来源',
      'tail.aria': '本轮的来源',
      'tail.open': '打开来源：{summary}',
      'tail.searched': '搜索了网络',
      'tail.searches.one': '{count} 次搜索',
      'tail.searches.other': '{count} 次搜索',
      'tail.sources.one': '{count} 个来源',
      'tail.sources.other': '{count} 个来源',
      'tail.pages.one': '{count} 个页面已读',
      'tail.pages.other': '{count} 个页面已读',
      'tail.join': '{sources} · {pages}',
      'tail.viewAll': '查看全部',
    };

    /* ------------------------------------------------------------------ urls */

    const HTTP_PROTOCOLS = new Set(['http:', 'https:']);
    const LIST_MARKER = /^(?:[-*•]\s+|\d{1,3}[.)]\s+|\[\d{1,3}\]\s*)/;
    const SUFFIX = /^\s*(?:[—–]|-(?!-)|:)\s+(.+)$/;
    const EXTENSION = /\.(?:html?|xhtml|php|aspx?|jsp|pdf|md|txt|json|xml|docx?|xlsx?|pptx?|zip)$/i;
    /** Colour palette anchor: the first entry is the host's business accent. */
    const AVATAR_COLORS = Object.freeze([
      'var(--dsw-alias-state-business-primary, #3b6ef6)',
      'hsl(268 52% 45%)',
      'hsl(198 62% 37%)',
      'hsl(150 42% 33%)',
      'hsl(36 76% 38%)',
      'hsl(10 64% 44%)',
      'hsl(330 50% 43%)',
      'hsl(88 40% 33%)',
    ]);

    /** Count occurrences of one character (used only for bracket balancing). */
    function countOf(text, character) {
      let count = 0;
      let index = -1;
      while ((index = text.indexOf(character, index + 1)) !== -1) count += 1;
      return count;
    }

    /**
     * A URL as it appears in prose is not a URL: it drags sentence punctuation
     * and closing brackets behind it. Strip that, keeping the parentheses a real
     * URL can contain (`…/Honey_bee_(disambiguation)`).
     * @param {string} value - the raw run of characters.
     * @returns {string} the trimmed candidate.
     */
    function stripTrailingPunctuation(value) {
      let text = String(value ?? '');
      for (;;) {
        if (text.length === 0) return text;
        const last = text.charAt(text.length - 1);
        if ('.,;:!?…\'"`*_>。，、'.includes(last)) {
          text = text.slice(0, -1);
          continue;
        }
        if (last === ')' && countOf(text, '(') < countOf(text, ')')) {
          text = text.slice(0, -1);
          continue;
        }
        if (last === ']' && countOf(text, '[') < countOf(text, ']')) {
          text = text.slice(0, -1);
          continue;
        }
        if (last === '}' && countOf(text, '{') < countOf(text, '}')) {
          text = text.slice(0, -1);
          continue;
        }
        return text;
      }
    }

    /**
     * Resolve one candidate to a displayable http(s) URL. Fragments are dropped:
     * a source is the page, not the anchor a result happened to cut.
     * @param {unknown} value - absolute URL, or a relative one when `baseUrl` is given.
     * @param {string} [baseUrl] - page the text was read from.
     * @returns {string|undefined} the normalized URL.
     */
    function toHttpUrl(value, baseUrl) {
      let candidate = String(value ?? '').trim();
      if (candidate === '') return undefined;
      const httpAt = candidate.search(/https?:\/\//i);
      if (httpAt > 0) candidate = candidate.slice(httpAt);
      if (!/^https?:\/\//i.test(candidate)) {
        if (baseUrl === undefined || baseUrl === null) return undefined;
        try {
          candidate = new URL(candidate, baseUrl).href;
        } catch {
          return undefined;
        }
      }
      candidate = stripTrailingPunctuation(candidate);
      let url;
      try {
        url = new URL(candidate);
      } catch {
        return undefined;
      }
      if (!HTTP_PROTOCOLS.has(url.protocol) || url.hostname === '') return undefined;
      url.hash = '';
      return url.href;
    }

    /**
     * The dedupe identity of a URL: lowercase host, no trailing slash, no fragment.
     * Query strings stay significant — `?page=1` and `?page=2` are different reads.
     * @param {string} value - a URL already resolved by {@link toHttpUrl}.
     * @returns {string|undefined} the identity, or undefined when it is not http(s).
     */
    function normalizeUrlKey(value) {
      let url;
      try {
        url = new URL(String(value ?? ''));
      } catch {
        return undefined;
      }
      if (!HTTP_PROTOCOLS.has(url.protocol) || url.hostname === '') return undefined;
      let path = url.pathname === '' ? '/' : url.pathname;
      if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
      const port = url.port === '' ? '' : `:${url.port}`;
      return `${url.protocol}//${url.hostname.toLowerCase()}${port}${path}${url.search}`;
    }

    /**
     * The host a reader would say out loud: lowercase, `www.` folded away.
     * @param {string} value - any URL.
     * @returns {string} hostname, or an empty string when unparseable.
     */
    function hostOf(value) {
      try {
        return new URL(String(value ?? '')).hostname.toLowerCase().replace(/^www\./, '');
      } catch {
        return '';
      }
    }

    /** Capitalize the first letter without touching the rest. */
    function capitalize(text) {
      return text.length === 0 ? text : text.charAt(0).toUpperCase() + text.slice(1);
    }

    /**
     * Cut at a word boundary so a clamped card never shows half a word where it
     * can be helped.
     * @param {string} text - source text.
     * @param {number} max - maximum length.
     * @returns {string} shortened text.
     */
    function trimAtWord(text, max) {
      if (text.length <= max) return text;
      const cut = text.slice(0, max);
      const space = cut.lastIndexOf(' ');
      return (space > max * 0.6 ? cut.slice(0, space) : cut).trim();
    }

    /**
     * Collapse result-text formatting a card should not repeat (markdown emphasis,
     * newlines) and bound the length.
     * @param {unknown} value - raw title/snippet.
     * @param {number} [maxLength] - bound in characters.
     * @returns {string|undefined} cleaned text.
     */
    function cleanText(value, maxLength) {
      if (typeof value !== 'string') return undefined;
      const cleaned = value
        .replace(/\*\*|__|`{1,3}/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleaned === '') return undefined;
      if (typeof maxLength === 'number' && cleaned.length > maxLength) {
        return `${trimAtWord(cleaned, maxLength - 1)}…`;
      }
      return cleaned;
    }

    /**
     * The title to show when the result text names none: the last meaningful
     * path segment, humanised; the host when the path says nothing.
     * @param {string} value - the source URL.
     * @returns {string} a title.
     */
    function titleFromUrl(value) {
      let url;
      try {
        url = new URL(String(value ?? ''));
      } catch {
        return hostOf(value) || 'Source';
      }
      const segments = url.pathname.split('/').filter(Boolean);
      for (let index = segments.length - 1; index >= 0; index -= 1) {
        let segment = segments[index];
        try {
          segment = decodeURIComponent(segment);
        } catch {
          /* keep the encoded segment */
        }
        segment = segment.replace(EXTENSION, '');
        if (segment === '' || /^\d+$/.test(segment)) continue;
        const words = segment.replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (words !== '') return capitalize(words).slice(0, 160);
      }
      return hostOf(url) || 'Source';
    }

    /* ---------------------------------------------------------------- parsing */

    /**
     * Markdown links on one line, with URL parentheses balanced by hand because a
     * regular expression cannot count them.
     * @param {string} line - one line of result text.
     * @returns {Array<{start:number,end:number,title:string|undefined,url:string}>} spans in order.
     */
    function markdownSpans(line) {
      const spans = [];
      let cursor = 0;
      for (;;) {
        const close = line.indexOf('](', cursor);
        if (close === -1) break;
        const open = line.lastIndexOf('[', close);
        if (open < cursor) {
          cursor = close + 2;
          continue;
        }
        const title = cleanText(line.slice(open + 1, close), 200);
        const urlStart = close + 2;
        let depth = 0;
        let index = urlStart;
        for (; index < line.length; index += 1) {
          const character = line.charAt(index);
          if (character === '(') {
            depth += 1;
            continue;
          }
          if (character === ')') {
            if (depth === 0) break;
            depth -= 1;
            continue;
          }
          if (/\s/.test(character)) break;
        }
        if (index >= line.length || line.charAt(index) !== ')') {
          cursor = close + 2;
          continue;
        }
        spans.push({ start: open, end: index + 1, title, url: line.slice(urlStart, index) });
        cursor = index + 1;
      }
      return spans;
    }

    /**
     * The label a line puts before a URL. Only structured lines (a list marker or
     * a trailing separator) are treated as titles, so prose like "see <url>" does
     * not become a card titled "see".
     * @param {string} line - one line of result text.
     * @param {number} end - where the URL starts.
     * @returns {string|undefined} the label.
     */
    function prefixTitle(line, end) {
      const before = line.slice(0, end).trim();
      if (before === '') return undefined;
      const structured = LIST_MARKER.test(before) || /[—–:]\s*$/.test(before);
      if (!structured) return undefined;
      const label = before.replace(LIST_MARKER, '').replace(/[—–:|]+\s*$/, '').trim();
      if (label === '' || label.length > 200 || /https?:\/\//i.test(label)) return undefined;
      return cleanText(label, 200);
    }

    /**
     * A bare line above a URL can be that URL's title (numbered result blocks put
     * the title on its own line).
     * @param {string} line - the previous non-empty line.
     * @returns {string|undefined} the title, when the line reads like a label.
     */
    function lookbackTitle(line) {
      if (line === '') return undefined;
      const structured = LIST_MARKER.test(line) || /[—–:]\s*$/.test(line);
      const label = line.replace(LIST_MARKER, '').replace(/[—–:|]+\s*$/, '').trim();
      if (label === '' || label.length > 200 || /https?:\/\//i.test(label)) return undefined;
      if (!structured && label.length > 120) return undefined;
      return cleanText(label, 200);
    }

    /**
     * Links on one line: markdown links first (title from the link text, trailing
     * ` — snippet`), then bare URLs (`Title — url`, `url — title`, or no label).
     * @param {string} line - one line of result text.
     * @param {string} [baseUrl] - page for relative `/url:` and link targets.
     * @returns {Array<{start:number,url:string,title:string|undefined,snippet:string|undefined}>} links in position order.
     */
    function lineLinks(line, baseUrl) {
      const spans = markdownSpans(line);
      const found = [];
      for (const span of spans) {
        const url = toHttpUrl(span.url, baseUrl);
        if (url === undefined) continue;
        const suffix = SUFFIX.exec(line.slice(span.end));
        found.push({ start: span.start, url, title: span.title, snippet: suffix ? cleanText(suffix[1], 360) : undefined });
      }
      const bare = /https?:\/\/[^\s<>"'`]+/gi;
      let match;
      while ((match = bare.exec(line)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (spans.some((span) => start < span.end && end > span.start)) continue;
        const url = toHttpUrl(match[0], baseUrl);
        if (url === undefined) continue;
        const title = prefixTitle(line, start);
        const suffix = SUFFIX.exec(line.slice(end));
        if (title !== undefined) {
          found.push({ start, url, title, snippet: suffix ? cleanText(suffix[1], 360) : undefined });
        } else if (suffix) {
          const label = cleanText(suffix[1], 200);
          found.push({ start, url, title: label, snippet: undefined });
        } else {
          found.push({ start, url, title: undefined, snippet: undefined });
        }
      }
      found.sort((left, right) => left.start - right.start);
      return found;
    }

    /**
     * Read one tool result's text as sources. Handles the two shapes this install
     * produces — markdown source lists and the accessibility snapshot that
     * `browse` returns (`- link "Name" [e5]:` followed by `- /url: …`) — plus
     * numbered result blocks and bare URLs.
     * @param {string} text - the tool result text.
     * @param {string} [baseUrl] - page the text was read from, for relative URLs.
     * @returns {Array<{url:string,title:string|undefined,snippet:string|undefined}>} candidates.
     */
    function scanText(text, baseUrl) {
      const found = [];
      let pendingTitle;
      let previous = '';
      for (const rawLine of String(text ?? '').split(/\r?\n/)) {
        const line = rawLine.trim();
        if (line === '') continue;
        const linkLine = /^-\s+link\s+"([^"]*)"\s*(?:\[[a-z]\d+\])?\s*:?$/.exec(line);
        if (linkLine) {
          pendingTitle = cleanText(linkLine[1], 200);
          previous = '';
          continue;
        }
        const urlLine = /^-\s+\/url:\s*(.+)$/.exec(line);
        if (urlLine) {
          const raw = urlLine[1].trim().replace(/^["'`]|["'`]$/g, '');
          const resolved = toHttpUrl(raw, baseUrl);
          if (resolved !== undefined) found.push({ url: resolved, title: pendingTitle, snippet: undefined });
          pendingTitle = undefined;
          previous = '';
          continue;
        }
        const links = lineLinks(line, baseUrl);
        if (links.length > 0) {
          const inert = line.replace(/https?:\/\/[^\s<>"'`]+/gi, '').trim();
          const fallbackTitle = inert === '' ? lookbackTitle(previous) : undefined;
          for (const link of links) {
            found.push({
              url: link.url,
              title: link.title !== undefined ? link.title : fallbackTitle,
              snippet: link.snippet,
            });
          }
          previous = line;
          continue;
        }
        previous = line;
      }
      return found;
    }

    /**
     * The best title a fetched page text offers: a markdown heading, then the
     * page's own title line, then the URL.
     * @param {string} text - the `web_fetch` result text.
     * @param {string} url - the fetched URL.
     * @returns {string} a title.
     */
    function fetchTitle(text, url) {
      const lines = String(text ?? '').split(/\r?\n/);
      const heading = /^#{1,3}\s+(.{3,200})$/;
      for (let index = 0; index < lines.length && index < 60; index += 1) {
        const line = lines[index].trim();
        if (line === '') continue;
        if (index < 4 && /^Fetched\s|^External web content follows/.test(line)) continue;
        const match = heading.exec(line);
        if (match) {
          const title = cleanText(match[1], 160);
          if (title !== undefined) return title;
        }
      }
      for (let index = 1; index < lines.length && index < 40; index += 1) {
        const line = lines[index].trim();
        if (line.length < 8 || line.length > 200) continue;
        if (/^(?:Fetched\s|External web content follows|\(Content truncated)/.test(line)) continue;
        if (/^[![#>|*]/.test(line)) continue;
        if (/https?:\/\//i.test(line)) continue;
        if (/^[\d\s.,:;()\-–—]+$/.test(line)) continue;
        const title = cleanText(line, 160);
        if (title !== undefined && title.length >= 8) return title;
      }
      return titleFromUrl(url);
    }

    /**
     * The search tool's candidates: the structured `meta.sources` it attaches to
     * the result (authoritative) plus anything the model-facing text names.
     * @param {object} result - folded result.
     * @returns {Array<object>} candidates.
     */
    function searchSources(result) {
      const candidates = [];
      const meta = result.meta !== null && typeof result.meta === 'object' ? result.meta : undefined;
      if (meta !== undefined && Array.isArray(meta.sources)) {
        for (const source of meta.sources) {
          if (source === null || typeof source !== 'object') continue;
          candidates.push({
            url: typeof source.url === 'string' ? source.url : undefined,
            title: cleanText(source.title, 200),
            snippet: cleanText(source.snippet ?? source.summary, 360),
          });
        }
      }
      for (const link of scanText(result.text, undefined)) candidates.push(link);
      return candidates;
    }

    /**
     * The fetch tool's candidate: the page it read. Body links are deliberately
     * ignored — reading one page does not make its navigation sources.
     * @param {object} args - parsed call arguments.
     * @param {object} result - folded result.
     * @returns {Array<object>} candidates.
     */
    function fetchSources(args, result) {
      const meta = result.meta !== null && typeof result.meta === 'object' ? result.meta : undefined;
      let url = meta !== undefined && typeof meta.url === 'string' ? meta.url : undefined;
      if (url === undefined) {
        const header = /^Fetched\s+(\S+?)\s+\(HTTP\s+\d+\)/i.exec(result.text);
        if (header) url = header[1];
      }
      if (url === undefined && typeof args.url === 'string') url = args.url;
      const final = toHttpUrl(url, undefined);
      if (final === undefined) return [];
      return [{ url: final, title: fetchTitle(result.text, final), snippet: undefined }];
    }

    /**
     * The page a browser call was working on: its own URL argument, or the URL it
     * says it opened. A later `snapshot` call on the same tab has neither, so the
     * last known page is threaded through from the caller.
     * @param {object} args - parsed call arguments.
     * @param {object} result - folded result.
     * @returns {string|undefined} the absolute page URL.
     */
    function browsePageOf(args, result) {
      if (typeof args.url === 'string') {
        const url = toHttpUrl(args.url, undefined);
        if (url !== undefined) return url;
      }
      const opened = /^Opened\s+(https?:\/\/\S+)/i.exec(result.text);
      return opened === null ? undefined : toHttpUrl(opened[1], undefined);
    }

    /**
     * The browser tool's candidates: the page it opened, plus every link its
     * snapshot or `links` action actually named (relative `/url:` values resolve
     * against the opened page, or the tab's last known page).
     * @param {object} args - parsed call arguments.
     * @param {object} result - folded result.
     * @param {string} [inheritedPage] - the tab's page from an earlier call.
     * @returns {Array<object>} candidates.
     */
    function browseSources(args, result, inheritedPage) {
      const candidates = [];
      const page = browsePageOf(args, result) ?? inheritedPage;
      const action = typeof args.action === 'string' ? args.action.toLowerCase() : '';
      const primary = action === 'open' ? page : undefined;
      if (primary !== undefined) candidates.push({ url: primary, title: undefined, snippet: undefined });
      for (const link of scanText(result.text, page)) candidates.push(link);
      return candidates;
    }

    /** `render_view` only names a page when the call itself carries its URL. */
    function renderViewSources(args) {
      const url = typeof args.url === 'string' ? toHttpUrl(args.url, undefined) : undefined;
      return url === undefined ? [] : [{ url, title: undefined, snippet: undefined }];
    }

    /**
     * Dispatch one call's result text to the parser its tool needs.
     * @param {string} name - tool name.
     * @param {object} args - parsed call arguments.
     * @param {object} result - folded result.
     * @param {string} [browserPage] - the browser tab's last known page.
     * @returns {Array<object>} candidates.
     */
    function sourcesForCall(name, args, result, browserPage) {
      switch (name) {
        case 'web_search':
          return searchSources(result);
        case 'web_fetch':
          return fetchSources(args, result);
        case 'browse':
          return browseSources(args, result, browserPage);
        case 'render_view':
          return renderViewSources(args);
        default:
          return [];
      }
    }

    /** The text blocks of one tool-result message, in order. */
    function textOf(content) {
      if (!Array.isArray(content)) return '';
      const parts = [];
      for (const block of content) {
        if (block !== null && typeof block === 'object' && block.type === 'text' && typeof block.text === 'string') {
          parts.push(block.text);
        }
      }
      return parts.join('\n');
    }

    /**
     * Normalize the window's entries to durable Session events. Client-only
     * transient rows are not part of the durable log and are skipped.
     * @param {unknown} entries - `SessionEventWindow.entries`.
     * @returns {Array<object>} Session events in order.
     */
    function eventList(entries) {
      if (!Array.isArray(entries)) return [];
      const events = [];
      for (const entry of entries) {
        if (entry === null || typeof entry !== 'object') continue;
        if (entry.type === 'event' && entry.event !== null && typeof entry.event === 'object') {
          events.push(entry.event);
        } else if (entry.type === 'transient') {
          continue;
        } else if (typeof entry.type === 'string' && entry.data !== null && typeof entry.data === 'object') {
          events.push(entry);
        }
      }
      return events;
    }

    /**
     * Fold the durable tool calls of one event window into per-call blocks.
     *
     * Calls are paired with their result by `callId`; a call whose result is
     * missing or failed contributes a block with no sources (the toolview still
     * renders for it, the Sources list does not). A call's `turn` is the number
     * the log wrote on the `tool/call`, which is what the per-turn strip keys on.
     *
     * @param {unknown} entries - `SessionEventWindow.entries`.
     * @returns {Array<{callId:string,name:string,turn:number|undefined,time:number|undefined,sources:Array<{key:string,source:object}>}>} blocks in event order.
     */
    function foldToolCalls(entries) {
      const events = eventList(entries);
      const results = new Map();
      for (const event of events) {
        if (event.type !== 'tool/result' || event.data === null || typeof event.data !== 'object') continue;
        const message = event.data.message;
        if (message === null || typeof message !== 'object') continue;
        const callId = message.toolCallId;
        if (typeof callId !== 'string' || callId === '') continue;
        results.set(callId, {
          isError: message.isError === true,
          text: textOf(message.content),
          meta: event.data.meta,
        });
      }

      const calls = [];
      let browserPage;
      for (const event of events) {
        if (event.type !== 'tool/call' || event.data === null || typeof event.data !== 'object') continue;
        const name = event.data.name;
        if (!WEB_TOOLS.has(name)) continue;
        const callId = event.data.callId;
        if (typeof callId !== 'string' || callId === '') continue;
        const result = results.get(callId);
        if (result === undefined) continue;
        let args = {};
        try {
          args = typeof event.data.arguments === 'string' ? JSON.parse(event.data.arguments) : event.data.arguments;
        } catch {
          args = {};
        }
        if (args === null || typeof args !== 'object') args = {};
        if (name === 'browse') browserPage = browsePageOf(args, result) ?? browserPage;

        const inCall = new Set();
        const sources = [];
        if (!result.isError) {
          for (const candidate of sourcesForCall(name, args, result, browserPage)) {
            const url = toHttpUrl(candidate.url, undefined);
            if (url === undefined) continue;
            const key = normalizeUrlKey(url);
            if (key === undefined) continue;
            const host = hostOf(url);
            if (host === '') continue;
            if (inCall.has(key)) continue;
            inCall.add(key);
            sources.push({
              key,
              source: {
                url,
                title: cleanText(candidate.title, 200) ?? titleFromUrl(url),
                host,
                snippet: cleanText(candidate.snippet, 360),
                tool: name,
                callId,
                firstSeen: typeof event.time === 'number' ? event.time : undefined,
              },
            });
          }
        }
        calls.push({
          callId,
          name,
          turn: typeof event.data.turn === 'number' ? event.data.turn : undefined,
          time: typeof event.time === 'number' ? event.time : undefined,
          sources,
        });
      }
      return calls;
    }

    /**
     * Flatten call blocks into source cards: newest call first, each call's own
     * order preserved, duplicates (same normalized URL) resolved in favour of the
     * newest call, capped at `limit`.
     * @param {Array<object>} calls - {@link foldToolCalls} output.
     * @param {number} limit - maximum cards.
     * @returns {Array<object>} source cards.
     */
    function collectSources(calls, limit) {
      const out = [];
      const seen = new Set();
      for (let index = calls.length - 1; index >= 0; index -= 1) {
        for (const item of calls[index].sources) {
          if (seen.has(item.key)) continue;
          seen.add(item.key);
          out.push(item.source);
          if (out.length >= limit) return out;
        }
      }
      return out;
    }

    /**
     * Fold one Session event window into source cards for the Sources tab.
     * @param {unknown} entries - `SessionEventWindow.entries`.
     * @returns {Array<{url:string,title:string,host:string,snippet:string|undefined,tool:string,callId:string,firstSeen:number|undefined}>} source cards.
     */
    function extractSources(entries) {
      return collectSources(foldToolCalls(entries), MAX_SOURCES);
    }

    /**
     * Fold one Session event window into the source cards of one turn.
     * @param {unknown} entries - `SessionEventWindow.entries`.
     * @param {number} turnNumber - the turn the cards belong to.
     * @returns {Array<object>} source cards for that turn.
     */
    function extractTurnSources(entries, turnNumber) {
      const calls = foldToolCalls(entries).filter((call) => call.turn === turnNumber);
      return collectSources(calls, MAX_SOURCES);
    }

    /**
     * What the per-turn strip shows, or null when the turn named no web sources.
     * @param {unknown} entries - `SessionEventWindow.entries`.
     * @param {number} turnNumber - the turn the strip belongs to.
     * @returns {{sources:Array<object>,searches:number,pages:number}|null} the strip's data.
     */
    function turnSourcesView(entries, turnNumber) {
      const calls = foldToolCalls(entries).filter((call) => call.turn === turnNumber && call.sources.length > 0);
      if (calls.length === 0) return null;
      const sources = collectSources(calls, MAX_SOURCES);
      if (sources.length === 0) return null;
      const counts = summarizeSources(sources);
      return { sources, searches: counts.searches, pages: counts.pages };
    }

    /**
     * Parse a raw `web_search`/`web_fetch` arguments string into an object.
     * @param {unknown} raw - the arguments JSON string from the call.
     * @returns {Record<string, unknown>|undefined} the parsed arguments.
     */
    function parseArgsRaw(raw) {
      if (typeof raw !== 'string' || raw === '') return undefined;
      try {
        const args = JSON.parse(raw);
        return args !== null && typeof args === 'object' ? args : undefined;
      } catch {
        return undefined;
      }
    }

    /**
     * The queries one `web_search` call asked, in order.
     * @param {unknown} raw - the call's arguments JSON string.
     * @returns {string[]} non-empty queries.
     */
    function queriesFromRaw(raw) {
      const args = parseArgsRaw(raw);
      if (args === undefined || !Array.isArray(args.queries)) return [];
      return args.queries
        .filter((query) => typeof query === 'string' && query.trim() !== '')
        .map((query) => query.trim());
    }

    /**
     * The URL one `web_fetch` call asked for.
     * @param {unknown} raw - the call's arguments JSON string.
     * @returns {string|undefined} the absolute URL.
     */
    function urlFromRaw(raw) {
      const args = parseArgsRaw(raw);
      return args !== undefined && typeof args.url === 'string' ? args.url : undefined;
    }

    /**
     * Rebuild the sources of one settled tool call from its ToolResultNode,
     * reusing {@link extractSources}: `meta.sources` is authoritative and the
     * result text is the fallback, exactly as the Sources tab reads the log.
     * @param {object} block - ToolResultNode at phase `'result'`.
     * @returns {Array<object>} source cards for this call.
     */
    function sourcesFromToolResult(block) {
      if (block === null || typeof block !== 'object') return [];
      if (!Array.isArray(block.content)) return [];
      const argsRaw = block.call !== null && typeof block.call === 'object' && typeof block.call.argsRaw === 'string'
        ? block.call.argsRaw
        : '{}';
      const callTime = typeof block.callTime === 'number' ? block.callTime : block.time;
      const callEvent = {
        type: 'event',
        event: {
          type: 'tool/call',
          seq: block.seq,
          time: callTime,
          data: { turn: 1, step: 1, callId: block.callId, name: block.name, arguments: argsRaw },
        },
      };
      const resultEvent = {
        type: 'event',
        event: {
          type: 'tool/result',
          seq: block.seq,
          time: block.time,
          data: {
            turn: 1,
            step: 1,
            message: {
              role: 'tool',
              toolCallId: block.callId,
              content: block.content,
              ...(block.isError === true ? { isError: true } : {}),
            },
            ...(block.meta === undefined ? {} : { meta: block.meta }),
          },
        },
      };
      return extractSources([callEvent, resultEvent]);
    }

    /**
     * How many distinct calls stand behind the cards, for the header's second
     * line. Only shown when both numbers are non-zero.
     * @param {Array<object>} sources - {@link extractSources} output.
     * @returns {{searches:number,pages:number}} distinct search calls and page reads.
     */
    function summarizeSources(sources) {
      const searches = new Set();
      const pages = new Set();
      for (const source of Array.isArray(sources) ? sources : []) {
        if (source === null || typeof source !== 'object') continue;
        if (typeof source.callId !== 'string') continue;
        if (source.tool === 'web_search') searches.add(source.callId);
        else if (source.tool === 'web_fetch' || source.tool === 'browse') pages.add(source.callId);
      }
      return { searches: searches.size, pages: pages.size };
    }

    /* ------------------------------------------------------------------ view */

    /** Deterministic colour: the same host always gets the same swatch. */
    function hostColor(host) {
      const text = String(host ?? '');
      let hash = 0;
      for (let index = 0; index < text.length; index += 1) {
        hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
      }
      return AVATAR_COLORS[hash % AVATAR_COLORS.length];
    }

    /** The letter the avatar shows. */
    function hostInitial(host) {
      const letter = String(host ?? '').replace(/^www\./, '').charAt(0);
      return letter === '' ? '?' : letter.toUpperCase();
    }

    /** Date and time where known; time alone for today. */
    function formatWhen(firstSeen) {
      if (typeof firstSeen !== 'number' || !Number.isFinite(firstSeen)) return undefined;
      try {
        const then = new Date(firstSeen);
        const now = new Date();
        const sameDay = then.toDateString() === now.toDateString();
        const format = new Intl.DateTimeFormat(undefined, sameDay
          ? { hour: 'numeric', minute: '2-digit' }
          : { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        return format.format(then);
      } catch {
        return undefined;
      }
    }

    /** Last-resort translate: a missing dictionary must not blank the pane. */
    function translator(t) {
      return typeof t === 'function' ? t : (key) => key;
    }

    /** One plural-aware label ("1 search" / "3 searches"). */
    function countText(t, base, count) {
      return t(`${base}.${count === 1 ? 'one' : 'other'}`, { count });
    }

    /** Where the open lands: the Sidebar's own browser page, else a new tab. */
    function openSource(source) {
      const sidebar = runtime.sidebarRight;
      if (sidebar !== null && typeof sidebar.openTab === 'function') {
        try {
          sidebar.openTab('browser', { params: { url: source.url } });
          return;
        } catch {
          /* the browser page is not registered in this composition */
        }
      }
      if (typeof window !== 'undefined' && typeof window.open === 'function') {
        window.open(source.url, '_blank', 'noopener,noreferrer');
      }
    }

    function SourceGlyph() {
      return h(
        'svg',
        { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M2.6 4.2h7.2M2.6 8h7.2M2.6 11.8h4.4', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' }),
        h('path', { d: 'M11.4 9.1v3.6M9.8 10.9h3.2', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' }),
      );
    }

    /**
     * Fold the Session's event window into cards and follow it while mounted.
     * The window publishes on every stream chunk, so state changes only when the
     * extracted list actually differs — a token stream must not re-render cards.
     */
    function useSourceList(sessions, sessionId) {
      const [state, setState] = useState({ status: 'loading', sources: [], sessionId });
      useEffect(() => {
        if (sessions === null || sessions === undefined || typeof sessions.binding !== 'function' || sessionId === undefined) {
          setState({ status: 'unavailable', sources: [], sessionId });
          return undefined;
        }
        let alive = true;
        let unsubscribe;
        let retry;
        let attempts = 0;
        let signature;
        const publish = () => {
          if (!alive) return;
          let window_ = null;
          try {
            const binding = sessions.binding(sessionId);
            window_ = binding === undefined ? null : binding.eventSource.getSnapshot();
          } catch {
            window_ = null;
          }
          if (window_ === null) {
            setState((current) => (current.status === 'loading' ? current : { status: 'loading', sources: [], sessionId }));
            return;
          }
          const sources = extractSources(window_.entries);
          const nextSignature = sources.map((source) => `${source.callId ?? ''}\u0000${source.url}\u0000${source.title}\u0000${source.snippet ?? ''}`).join('\u0001');
          if (nextSignature === signature) return;
          signature = nextSignature;
          setState({ status: 'ready', sources, sessionId });
        };
        const attach = () => {
          if (!alive) return;
          let binding;
          try {
            binding = sessions.binding(sessionId);
          } catch {
            binding = undefined;
          }
          if (binding === undefined) {
            attempts += 1;
            if (attempts > 20) {
              setState((current) => (current.status === 'ready' ? current : { status: 'unavailable', sources: [], sessionId }));
              return;
            }
            retry = setTimeout(attach, 300);
            return;
          }
          try {
            unsubscribe = binding.eventSource.subscribe(publish);
          } catch {
            setState({ status: 'unavailable', sources: [], sessionId });
            return;
          }
          publish();
        };
        attach();
        return () => {
          alive = false;
          if (retry !== undefined) clearTimeout(retry);
          if (typeof unsubscribe === 'function') {
            try {
              unsubscribe();
            } catch {
              /* the source is already disposed with the generation */
            }
          }
        };
      }, [sessions, sessionId]);
      // A switch to another Session must not paint the previous session's cards.
      return state.sessionId === sessionId ? state : { status: 'loading', sources: [] };
    }

    /** Cached per-Session call fold shared by every mounted turn strip. */
    const TURN_FOLD_CACHE = new Map();

    /** Acquire the Session's shared fold cache (one fold per published window). */
    function acquireTurnFold(sessionId) {
      let cache = TURN_FOLD_CACHE.get(sessionId);
      if (cache === undefined) {
        cache = { users: 0, entries: undefined, calls: [] };
        TURN_FOLD_CACHE.set(sessionId, cache);
      }
      cache.users += 1;
      return cache;
    }

    /** Release the Session's fold cache; the last reader frees it. */
    function releaseTurnFold(sessionId) {
      const cache = TURN_FOLD_CACHE.get(sessionId);
      if (cache === undefined) return;
      cache.users -= 1;
      if (cache.users <= 0) TURN_FOLD_CACHE.delete(sessionId);
    }

    /** Fold the window once per publication, shared by every turn strip. */
    function foldWindowInto(cache, entries) {
      if (cache.entries === entries) return cache.calls;
      const calls = foldToolCalls(entries);
      cache.entries = entries;
      cache.calls = calls;
      return calls;
    }

    /**
     * Follow one turn's tool calls off the Session event window. Every mounted
     * strip of the same Session shares one fold, so a token stream costs one pass
     * over the window, not one per turn on screen.
     * @param {object|undefined} sessions - the sessions service.
     * @param {string|undefined} sessionId - viewed Session.
     * @param {number|undefined} turnNumber - the turn whose calls are needed.
     * @returns {{status:string, calls:Array<object>}} the turn's call blocks.
     */
    function useTurnCalls(sessions, sessionId, turnNumber) {
      const [state, setState] = useState({ status: 'loading', calls: [] });
      useEffect(() => {
        if (sessions === null || sessions === undefined || typeof sessions.binding !== 'function' || sessionId === undefined || typeof turnNumber !== 'number') {
          setState({ status: 'unavailable', calls: [] });
          return undefined;
        }
        const cache = acquireTurnFold(sessionId);
        let alive = true;
        let unsubscribe;
        let retry;
        let attempts = 0;
        let signature;
        const publish = () => {
          if (!alive) return;
          let window_ = null;
          try {
            const binding = sessions.binding(sessionId);
            window_ = binding === undefined ? null : binding.eventSource.getSnapshot();
          } catch {
            window_ = null;
          }
          if (window_ === null) {
            setState((current) => (current.status === 'loading' ? current : { status: 'loading', calls: [] }));
            return;
          }
          const all = foldWindowInto(cache, window_.entries);
          const calls = all.filter((call) => call.turn === turnNumber);
          const nextSignature = calls.map((call) => `${call.callId}:${call.sources.length}`).join('|');
          if (nextSignature === signature) return;
          signature = nextSignature;
          setState({ status: 'ready', calls });
        };
        const attach = () => {
          if (!alive) return;
          let binding;
          try {
            binding = sessions.binding(sessionId);
          } catch {
            binding = undefined;
          }
          if (binding === undefined) {
            attempts += 1;
            if (attempts > 20) {
              setState((current) => (current.status === 'ready' ? current : { status: 'unavailable', calls: [] }));
              return;
            }
            retry = setTimeout(attach, 300);
            return;
          }
          try {
            unsubscribe = binding.eventSource.subscribe(publish);
          } catch {
            setState({ status: 'unavailable', calls: [] });
            return;
          }
          publish();
        };
        attach();
        return () => {
          alive = false;
          if (retry !== undefined) clearTimeout(retry);
          releaseTurnFold(sessionId);
          if (typeof unsubscribe === 'function') {
            try {
              unsubscribe();
            } catch {
              /* the source is already disposed with the generation */
            }
          }
        };
      }, [sessions, sessionId, turnNumber]);
      return state;
    }

    function SourceCard({ source, t }) {
      const when = formatWhen(source.firstSeen);
      const title = source.title === '' ? titleFromUrl(source.url) : source.title;
      return h(
        'button',
        {
          type: 'button',
          className: CARD,
          title: source.url,
          'aria-label': t('card.aria', { title, host: source.host }),
          onClick: () => openSource(source),
        },
        h('span', { className: AVATAR, style: { background: hostColor(source.host) }, 'aria-hidden': 'true' }, hostInitial(source.host)),
        h(
          'span',
          { className: BODY },
          h(
            'span',
            { className: LINE },
            h('span', { className: HOST }, source.host),
            when === undefined ? null : h('span', { className: WHEN }, when),
          ),
          h('span', { className: TITLE }, title),
          source.snippet === undefined ? null : h('span', { className: SNIPPET }, source.snippet),
        ),
      );
    }

    function SkeletonRows({ t }) {
      return h(
        'div',
        { className: LIST, role: 'status', 'aria-live': 'polite', 'aria-label': t('loading') },
        [0, 1, 2].map((index) =>
          h(
            'div',
            { key: index, className: SKELETON, 'aria-hidden': 'true' },
            h('span', { className: SKELETON_AVATAR }),
            h(
              'span',
              { className: SKELETON_BODY },
              h('span', { className: `${SKELETON_LINE} ${SKELETON_SHORT}` }),
              h('span', { className: SKELETON_LINE }),
              h('span', { className: SKELETON_LINE }),
            ),
          ),
        ),
      );
    }

    function QuietState({ glyph, title, hint, className }) {
      return h(
        'div',
        { className },
        glyph ? h('span', { className: EMPTY_GLYPH, 'aria-hidden': 'true' }, glyph) : null,
        h('p', { className: EMPTY_TITLE }, title),
        h('p', { className: EMPTY_HINT }, hint),
      );
    }

    /**
     * The tab's face, independent of where the cards came from: header, then
     * skeletons, a quiet state, or the card list. Split from the data hook so the
     * self-test can pin all three branches without a browser.
     * @param {{status: string, sources: Array<object>, t: Function}} props - view state.
     */
    function SourcesView({ status, sources, t }) {
      const counts = useMemo(() => summarizeSources(sources), [sources]);
      const showMeta = status === 'ready' && counts.searches > 0 && counts.pages > 0;

      let content;
      if (status === 'loading') {
        content = h(SkeletonRows, { t });
      } else if (status === 'unavailable') {
        content = h(QuietState, {
          className: EMPTY,
          title: t('unavailable.title'),
          hint: t('unavailable.hint'),
        });
      } else if (sources.length === 0) {
        content = h(QuietState, { className: EMPTY, glyph: h(SourceGlyph), title: t('empty.title'), hint: t('empty.hint') });
      } else {
        content = h(
          'ul',
          { className: LIST },
          sources.map((source, index) =>
            h('li', { key: `${source.callId}:${source.url}:${index}`, className: ITEM }, h(SourceCard, { source, t })),
          ),
        );
      }

      return h(
        'div',
        { className: ROOT, 'data-dsh-search-ui': '' },
        h(
          'header',
          { className: HEAD },
          h(
            'div',
            { className: HEAD_ROW },
            h('h2', { className: HEADING }, t('title')),
            status === 'ready' && sources.length > 0
              ? h('span', { className: COUNT, 'aria-label': t('count.aria', { count: sources.length }) }, String(sources.length))
              : null,
          ),
          showMeta
            ? h('p', { className: META }, t('meta.join', {
                searches: countText(t, 'meta.searches', counts.searches),
                pages: countText(t, 'meta.pages', counts.pages),
              }))
            : null,
        ),
        content,
      );
    }

    /**
     * The tab body. Session-scope slots hand it the Session and this plugin's
     * bound translator; the data hook follows the event window and the view
     * renders it.
     */
    function SourcesBody(props) {
      const t = translator(props.t);
      const { status, sources } = useSourceList(runtime.sessions, props.sessionId);
      return h(SourcesView, { status, sources, t });
    }

    /**
     * The Conversation header entry point: one icon that opens (or reveals) the
     * Sources page. The pane's guide also offers a card, this makes the tab one
     * click away from the conversation that produced the sources.
     */
    function SourcesTrigger(props) {
      const t = translator(props.t);
      return h(
        'button',
        {
          type: 'button',
          className: TRIGGER,
          title: t('trigger.tooltip'),
          'aria-label': t('trigger.aria'),
          onClick: () => {
            if (typeof props.open === 'function') props.open();
          },
        },
        h(SourceGlyph),
      );
    }

    /* ----------------------------------------------------------- inline rows */

    /** Maximum source rows the expanded tool row shows before "View all". */
    const INLINE_MAX_ROWS = 6;

    /** Open this plugin's own tab — the full source list for the Session. */
    function openSourcesPage() {
      const sidebar = runtime.sidebarRight;
      if (sidebar === null || typeof sidebar.openTab !== 'function') return;
      try {
        sidebar.openTab(TAB_KIND);
      } catch {
        /* the page type is not registered in this composition */
      }
    }

    function MagnifierGlyph() {
      return h(
        'svg',
        { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('circle', { cx: 7, cy: 7, r: 4.2, stroke: 'currentColor', strokeWidth: 1.4 }),
        h('path', { d: 'M10.2 10.2 14 14', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }),
      );
    }

    function PageGlyph() {
      return h(
        'svg',
        { width: 13, height: 13, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M3 2.5h6.5L13 6v7.5H3z', stroke: 'currentColor', strokeWidth: 1.2, strokeLinejoin: 'round' }),
        h('path', { d: 'M9.3 2.7V6H12.7', stroke: 'currentColor', strokeWidth: 1.2, strokeLinejoin: 'round' }),
      );
    }

    function ChevronGlyph() {
      return h(
        'svg',
        { width: 12, height: 12, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M4 6l4 4 4-4', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      );
    }

    function ExternalGlyph() {
      return h(
        'svg',
        { width: 12, height: 12, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true' },
        h('path', { d: 'M5 11 11 5M6 5h5v5', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }),
      );
    }

    /**
     * The overlapping letter avatars a collapsed row and the turn strip show:
     * at most three, then the count of the rest.
     * @param {{sources: Array<object>}} props - cards to represent.
     */
    function AvatarStack({ sources }) {
      const shown = Array.isArray(sources) ? sources.slice(0, 3) : [];
      const more = (Array.isArray(sources) ? sources.length : 0) - shown.length;
      return h(
        'span',
        { className: INLINE_STACK, 'aria-hidden': 'true' },
        shown.map((source, index) =>
          h(
            'span',
            { key: `${source.host}:${index}`, className: INLINE_CHIP, style: { background: hostColor(source.host) } },
            hostInitial(source.host),
          ),
        ),
        more > 0 ? h('span', { className: INLINE_MORE }, `+${more}`) : null,
      );
    }

    /**
     * The query copy a collapsed search row shows: queries in quotes while they
     * stay short, a count once there are more than two.
     * @param {Function} t - bound translator.
     * @param {string[]} queries - the call's queries.
     * @returns {string|undefined} copy, when the call named any query.
     */
    function queryLabel(t, queries) {
      if (!Array.isArray(queries) || queries.length === 0) return undefined;
      if (queries.length === 1) return `"${queries[0]}"`;
      if (queries.length === 2) {
        const joined = `"${queries[0]}", "${queries[1]}"`;
        if (joined.length <= 64) return joined;
      }
      return t('row.queries', { count: queries.length });
    }

    /** One expanded source row: avatar, title (single line), host, open affordance. */
    function InlineSourceRow({ source, t, onOpen }) {
      const title = source.title || titleFromUrl(source.url);
      return h(
        'button',
        {
          type: 'button',
          className: INLINE_SOURCE,
          title: source.url,
          'aria-label': t('row.open.aria', { title, host: source.host }),
          onClick: () => onOpen(source),
        },
        h('span', { className: INLINE_AVATAR, style: { background: hostColor(source.host) }, 'aria-hidden': 'true' }, hostInitial(source.host)),
        h('span', { className: INLINE_TITLE }, title),
        h('span', { className: INLINE_HOST }, source.host),
        h('span', { className: INLINE_EXT, 'aria-hidden': 'true' }, h(ExternalGlyph)),
      );
    }

    /**
     * The expanded body under a search/fetch row: "Read N pages", up to six
     * source rows, then the way to the full list.
     * @param {{toolName: string, sources: Array<object>, t: Function, onOpenSource: Function, onOpenSources: Function}} props - body props.
     */
    function InlineExpanded({ toolName, sources, t, onOpenSource, onOpenSources }) {
      const isFetch = toolName === 'web_fetch';
      const shown = isFetch ? sources.slice(0, 1) : sources.slice(0, INLINE_MAX_ROWS);
      return h(
        'div',
        { className: INLINE_BODY },
        h(
          'div',
          { className: INLINE_HEADING },
          h(PageGlyph),
          h('span', null, t(sources.length === 1 ? 'read.heading.one' : 'read.heading.other', { count: sources.length })),
        ),
        shown.map((source, index) =>
          h(InlineSourceRow, { key: `${source.callId}:${source.url}:${index}`, source, t, onOpen: onOpenSource }),
        ),
        h(
          'div',
          { className: INLINE_ACTIONS },
          sources.length > shown.length
            ? h('button', { type: 'button', className: INLINE_LINK, onClick: onOpenSources }, t('read.viewAll', { count: sources.length }))
            : null,
          h('button', { type: 'button', className: INLINE_LINK, onClick: onOpenSources }, t('read.openSources')),
        ),
      );
    }

    /** The expanded body of a failed call: the tool's reason, never a silent row. */
    function InlineErrorBody({ message, t, onOpenSources }) {
      return h(
        'div',
        { className: INLINE_BODY },
        h('p', { className: INLINE_ERROR }, message),
        h(
          'div',
          { className: INLINE_ACTIONS },
          h('button', { type: 'button', className: INLINE_LINK, onClick: onOpenSources }, t('read.openSources')),
        ),
      );
    }

    /** The one line a failed call shows in its body. */
    function toolErrorText(block, t) {
      const reason = block.error !== null && typeof block.error === 'object' && typeof block.error.reason === 'string'
        ? block.error.reason
        : undefined;
      if (reason !== undefined && reason.trim() !== '') return reason.trim().slice(0, 2000);
      const text = textOf(block.content).trim();
      if (text !== '') return text.slice(0, 2000);
      return t('row.search.failed');
    }

    /**
     * Replacement view for the `web_search` and `web_fetch` tool rows.
     *
     * Collapsed: glyph, action ("Searched the web" / "Read <host>"), the query or
     * title, the page count, up to three letter avatars plus the remainder, and a
     * chevron. Expanded: "Read N pages" with source rows that open the sidebar
     * browser, plus the way to the full Sources tab.
     */
    function WebToolRow(props) {
      const t = translator(props.t);
      const toolName = props.toolName;
      const phase = props.phase;
      const block = props.block !== null && typeof props.block === 'object' ? props.block : undefined;
      const disclosure = typeof props.useDisclosure === 'function'
        ? props.useDisclosure()
        : { expanded: false, setExpanded() {}, toggle() {} };
      const isFetch = toolName === 'web_fetch';
      const isResult = phase === 'result' && block !== undefined;
      const failed = isResult && block.isError === true;
      const sources = isResult ? sourcesFromToolResult(block) : [];

      let argsRaw;
      if (phase === 'start' && block !== undefined && typeof block.argsRaw === 'string') {
        argsRaw = block.argsRaw;
      } else if (isResult && block.call !== null && typeof block.call === 'object' && typeof block.call.argsRaw === 'string') {
        argsRaw = block.call.argsRaw;
      }
      const queries = queriesFromRaw(argsRaw);
      const metaUrl = isResult && block.meta !== null && typeof block.meta === 'object' && typeof block.meta.url === 'string'
        ? block.meta.url
        : undefined;
      const fetchUrl = isFetch ? (metaUrl ?? urlFromRaw(argsRaw)) : undefined;
      const fetchHost = fetchUrl === undefined ? '' : hostOf(fetchUrl);
      const fetchTitle = isFetch
        ? sources.length > 0
          ? sources[0].title
          : fetchUrl === undefined
            ? ''
            : titleFromUrl(fetchUrl)
        : '';

      const expanded = disclosure.expanded === true && isResult;
      const label = isFetch
        ? failed
          ? t('row.fetch.failed')
          : isResult
            ? t('row.fetch.done', { host: fetchHost === '' ? 'web' : fetchHost })
            : t('row.fetch.pending', { host: fetchHost === '' ? 'web' : fetchHost })
        : failed
          ? t('row.search.failed')
          : isResult
            ? t('row.search.done')
            : t('row.search.pending');
      const queryText = isFetch ? (isResult && fetchTitle !== '' ? fetchTitle : undefined) : queryLabel(t, queries);
      const pagesLabel = !isFetch && isResult && sources.length > 0
        ? t(sources.length === 1 ? 'row.pages.one' : 'row.pages.other', { count: sources.length })
        : undefined;

      const headChildren = [
        h('span', { key: 'glyph', className: INLINE_GLYPH }, h(isFetch ? PageGlyph : MagnifierGlyph)),
        h('span', { key: 'label', className: INLINE_LABEL }, label),
        queryText === undefined ? null : h('span', { key: 'query', className: INLINE_QUERY }, queryText),
        pagesLabel === undefined ? null : h('span', { key: 'pages', className: INLINE_MUTED }, pagesLabel),
        sources.length > 0 ? h(AvatarStack, { key: 'stack', sources }) : null,
        isResult ? h('span', { key: 'chev', className: INLINE_CHEV, 'aria-hidden': 'true' }, h(ChevronGlyph)) : null,
      ];

      const head = isResult
        ? h(
            'button',
            {
              type: 'button',
              className: INLINE_HEAD,
              'aria-expanded': expanded,
              onClick: () => disclosure.toggle(),
            },
            headChildren,
          )
        : h('div', { className: `${INLINE_HEAD} ${INLINE_HEAD_PENDING}` }, headChildren);

      let body = null;
      if (expanded) {
        if (failed) {
          body = h(InlineErrorBody, { message: toolErrorText(block, t), t, onOpenSources: openSourcesPage });
        } else if (sources.length === 0) {
          body = h(
            'div',
            { className: INLINE_BODY },
            h('p', { className: INLINE_ERROR }, t('row.empty')),
            h(
              'div',
              { className: INLINE_ACTIONS },
              h('button', { type: 'button', className: INLINE_LINK, onClick: openSourcesPage }, t('read.openSources')),
            ),
          );
        } else {
          body = h(InlineExpanded, {
            toolName,
            sources,
            t,
            onOpenSource: openSource,
            onOpenSources: openSourcesPage,
          });
        }
      }

      return h('div', { className: INLINE, 'data-tool': toolName, 'data-state': phase }, head, body);
    }

    /**
     * The compact strip a completed turn ends with: avatar stack, source/page
     * count, and one way into the full list. Renders nothing without sources.
     */
    function TurnSourcesView({ sources, searches, pages, t, onOpenSources }) {
      if (!Array.isArray(sources) || sources.length === 0) return null;
      const parts = [];
      if (typeof searches === 'number' && searches > 0) {
        parts.push(t(searches === 1 ? 'tail.searches.one' : 'tail.searches.other', { count: searches }));
      }
      parts.push(t(sources.length === 1 ? 'tail.sources.one' : 'tail.sources.other', { count: sources.length }));
      if (typeof pages === 'number' && pages > 0) {
        parts.push(t(pages === 1 ? 'tail.pages.one' : 'tail.pages.other', { count: pages }));
      }
      const summary = parts.join(' · ');
      return h(
        'button',
        {
          type: 'button',
          className: TAIL,
          title: t('tail.open', { summary }),
          'aria-label': t('tail.open', { summary }),
          onClick: onOpenSources,
        },
        h('span', { className: TAIL_ICON, 'aria-hidden': 'true' }, h(MagnifierGlyph, null)),
        h('span', { className: TAIL_LEAD }, t('tail.searched')),
        h('span', { className: TAIL_LABEL }, summary),
        h('span', { className: TAIL_STACK }, h(AvatarStack, { sources })),
        h('span', { className: TAIL_VIEW, 'aria-hidden': 'true' }, t('tail.viewAll')),
      );
    }

    /** Turn-tail entry: follows the turn's calls and hides when it named no sources. */
    function TurnSourcesStrip(props) {
      const t = translator(props.t);
      const turnNumber = props.turn !== null && typeof props.turn === 'object' && typeof props.turn.turn === 'number'
        ? props.turn.turn
        : undefined;
      const { status, calls } = useTurnCalls(runtime.sessions, props.sessionId, turnNumber);
      if (status !== 'ready' || !Array.isArray(calls) || calls.length === 0) return null;
      const sources = collectSources(calls, MAX_SOURCES);
      if (sources.length === 0) return null;
      const counts = summarizeSources(sources);
      return h(TurnSourcesView, {
        sources,
        searches: counts.searches,
        pages: counts.pages,
        t,
        onOpenSources: openSourcesPage,
      });
    }

    /* ----------------------------------------------------------------- style */

    const CSS = `
.${ROOT} {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  box-sizing: border-box;
  color: var(--dsw-alias-label-primary, #111827);
  background: var(--dsw-alias-bg-base, transparent);
}
.${HEAD} {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  padding: 12px clamp(10px, 3.2vw, 16px) 10px;
  border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.22));
}
.${HEAD_ROW} {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: nowrap;
  min-width: 0;
}
.${HEADING} {
  margin: 0;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
  color: var(--dsw-alias-label-primary, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.${COUNT} {
  flex: 0 0 auto;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2, rgba(127, 127, 127, 0.09));
  color: var(--dsw-alias-label-secondary, #6b7280);
  font-size: 11px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
}
.${META} {
  margin: 0;
  min-width: 0;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  font-size: 11.5px;
  line-height: 1.45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.${LIST} {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  margin: 0;
  padding: 8px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  box-sizing: border-box;
}
.${ITEM} {
  display: flex;
  min-width: 0;
  margin: 0;
  padding: 0;
}
.${CARD} {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 44px;
  box-sizing: border-box;
  margin: 0;
  padding: 9px 9px 10px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.22));
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-layer-1, rgba(127, 127, 127, 0.05));
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}
.${AVATAR} {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  border-radius: var(--dsw-radius-sm, 4px);
  color: var(--dsw-alias-label-primary-foreground, #fff);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  text-transform: uppercase;
}
.${BODY} {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1 1 auto;
  min-width: 0;
}
.${LINE} {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.${HOST} {
  flex: 0 1 auto;
  min-width: 0;
  color: var(--dsw-alias-label-secondary, #6b7280);
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.${WHEN} {
  flex: 0 0 auto;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  font-size: 11px;
  line-height: 1.4;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.${TITLE} {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--dsw-alias-label-primary, #111827);
  overflow-wrap: anywhere;
  word-break: break-word;
}
.${SNIPPET} {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.45;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  overflow-wrap: anywhere;
  word-break: break-word;
}
.${EMPTY} {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 28px 18px 34px;
  text-align: center;
}
.${EMPTY_GLYPH} {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  margin-bottom: 6px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.22));
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-layer-1, rgba(127, 127, 127, 0.05));
  color: var(--dsw-alias-label-tertiary, #9ca3af);
}
.${EMPTY_TITLE} {
  margin: 0;
  color: var(--dsw-alias-label-secondary, #6b7280);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.${EMPTY_HINT} {
  margin: 0;
  max-width: 34ch;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.${SKELETON} {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  min-width: 0;
  min-height: 44px;
  box-sizing: border-box;
  padding: 10px 9px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.22));
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-layer-1, rgba(127, 127, 127, 0.05));
}
.${SKELETON_AVATAR} {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border-radius: var(--dsw-radius-sm, 4px);
  background: var(--dsw-alias-bg-layer-2, rgba(127, 127, 127, 0.09));
}
.${SKELETON_BODY} {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 auto;
  min-width: 0;
  padding-top: 2px;
}
.${SKELETON_LINE} {
  height: 9px;
  min-width: 0;
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2, rgba(127, 127, 127, 0.09));
  animation: dsh-sources-pulse 1.6s ease-in-out infinite;
}
.${SKELETON_SHORT} {
  width: 38%;
}
.${TRIGGER} {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  min-width: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--dsw-radius-sm, 4px);
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b7280);
  cursor: pointer;
}
.${CARD}:focus-visible,
.${TRIGGER}:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary, #3b6ef6);
  outline-offset: 1px;
}
.${CARD}:active {
  background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.08));
}
@media (hover: hover) {
  .${CARD}:hover {
    background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.08));
    border-color: var(--dsw-alias-border-l4, rgba(127, 127, 127, 0.4));
  }
  .${TRIGGER}:hover {
    background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.08));
    color: var(--dsw-alias-label-primary, #111827);
  }
}
@media (max-width: 420px) {
  .${HEAD} {
    padding: 10px 10px 8px;
  }
  .${LIST} {
    padding: 5px;
    gap: 5px;
  }
  .${CARD} {
    gap: 8px;
    padding: 8px 7px 9px;
  }
}
@keyframes dsh-sources-pulse {
  50% { opacity: 0.45; }
}
@media (prefers-reduced-motion: reduce) {
  .${SKELETON_LINE} { animation: none; }
  .${CARD} { transition: none; }
}
.${INLINE} {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  margin: 2px 0;
  border: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.22));
  border-radius: var(--dsw-radius-md, 8px);
  background: var(--dsw-alias-bg-layer-1, rgba(127, 127, 127, 0.05));
  overflow: hidden;
}
.${INLINE_HEAD} {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  min-width: 0;
  height: 32px;
  box-sizing: border-box;
  margin: 0;
  padding: 0 8px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b7280);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.2;
  text-align: left;
  cursor: pointer;
}
.${INLINE_HEAD_PENDING} {
  cursor: default;
}
.${INLINE_GLYPH} {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
}
.${INLINE_LABEL} {
  flex: 0 0 auto;
  white-space: nowrap;
  color: var(--dsw-alias-label-secondary, #6b7280);
}
.${INLINE_QUERY} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
}
.${INLINE_MUTED} {
  flex: 0 0 auto;
  white-space: nowrap;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.${INLINE_STACK} {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  margin-left: 1px;
}
.${INLINE_CHIP} {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: -4px;
  border: 1.5px solid var(--dsw-alias-bg-base, transparent);
  border-radius: 999px;
  color: var(--dsw-alias-label-primary-foreground, #fff);
  font-size: 8px;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
}
.${INLINE_CHIP}:first-child {
  margin-left: 0;
}
.${INLINE_MORE} {
  flex: 0 0 auto;
  margin-left: 4px;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.${INLINE_CHEV} {
  flex: 0 0 auto;
  display: inline-flex;
  margin-left: auto;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  transition: transform 120ms ease;
}
.${INLINE_HEAD}[aria-expanded="true"] .${INLINE_CHEV} {
  transform: rotate(180deg);
}
.${INLINE_BODY} {
  border-top: 1px solid var(--dsw-alias-border-l1, rgba(127, 127, 127, 0.14));
}
.${INLINE_HEADING} {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px 4px;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  font-size: 11.5px;
  line-height: 1.4;
}
.${INLINE_SOURCE} {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  box-sizing: border-box;
  margin: 0;
  padding: 6px 8px;
  border: 0;
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease;
}
.${INLINE_SOURCE} + .${INLINE_SOURCE} {
  border-top: 1px solid var(--dsw-alias-border-l1, rgba(127, 127, 127, 0.14));
}
.${INLINE_AVATAR} {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: var(--dsw-radius-sm, 4px);
  color: var(--dsw-alias-label-primary-foreground, #fff);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
}
.${INLINE_TITLE} {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-primary, #111827);
  font-size: 13px;
  line-height: 1.4;
}
.${INLINE_HOST} {
  flex: 0 0 auto;
  max-width: 36%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  font-size: 11.5px;
  line-height: 1.4;
}
.${INLINE_EXT} {
  flex: 0 0 auto;
  display: inline-flex;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
}
.${INLINE_ACTIONS} {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 8px 6px;
}
.${INLINE_LINK} {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 24px;
  margin: 0;
  padding: 2px 6px;
  border: 0;
  border-radius: var(--dsw-radius-sm, 4px);
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b7280);
  font-family: inherit;
  font-size: 11.5px;
  line-height: 1.4;
  cursor: pointer;
}
.${INLINE_ERROR} {
  margin: 0;
  padding: 6px 8px 4px;
  max-height: 180px;
  overflow: auto;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  font-size: 11.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.${TAIL} {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  margin: 2px 0 8px;
  padding: 5px 8px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.25));
  border-radius: var(--dsw-radius-md, 8px);
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
  font-family: inherit;
  font-size: 12.5px;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}
@media (hover: hover) {
  .${TAIL}:hover {
    background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.1));
    border-color: var(--dsw-alias-border-l3, rgba(127, 127, 127, 0.4));
  }
}
.${TAIL}:focus-visible {
  outline: 2px solid var(--dsw-alias-label-primary, #111827);
  outline-offset: 2px;
}
.${TAIL_ICON} {
  flex: none;
  display: inline-flex;
  color: var(--dsw-alias-label-tertiary, #9ca3af);
}
.${TAIL_LEAD} {
  flex: none;
  color: var(--dsw-alias-label-secondary, #6b7280);
}
.${TAIL_LABEL} {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.${TAIL_STACK} {
  flex: 0 0 auto;
  display: inline-flex;
}
.${TAIL_VIEW} {
  flex: 0 0 auto;
  margin-left: auto;
  padding-left: 8px;
  color: var(--dsw-alias-label-secondary, #6b7280);
  font-size: 11.5px;
}
@media (max-width: 520px) {
  .${TAIL_STACK},
  .${TAIL_LEAD} {
    display: none;
  }
  .${TAIL} {
    padding: 6px 8px;
  }
}
.${INLINE_HEAD}:focus-visible,.${INLINE_HEAD}:focus-visible,
.${INLINE_SOURCE}:focus-visible,
.${INLINE_LINK}:focus-visible,
.${TAIL_VIEW}:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary, #3b6ef6);
  outline-offset: -1px;
}
@media (hover: hover) {
  .${INLINE_HEAD}:hover,
  .${INLINE_SOURCE}:hover,
  .${INLINE_LINK}:hover {
    background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.08));
  }
  .${TAIL_VIEW}:hover {
    background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.08));
    color: var(--dsw-alias-label-primary, #111827);
  }
}
@media (max-width: 420px) {
  .${INLINE_HOST} {
    display: none;
  }
  .${INLINE} {
    margin: 1px 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .${INLINE_CHEV},
  .${INLINE_SOURCE} {
    transition: none;
  }
}
`;

    /** Inject the stylesheet once; returns its cleanup. */
    function installStyles() {
      if (typeof document === 'undefined' || document.head === undefined || document.head === null) {
        return () => {};
      }
      if (typeof document.querySelector === 'function' && document.querySelector(`style[${STYLE_ATTR}]`) !== null) {
        return () => {};
      }
      const tag = document.createElement('style');
      tag.setAttribute(STYLE_ATTR, '');
      tag.textContent = CSS;
      document.head.appendChild(tag);
      return () => {
        if (typeof tag.remove === 'function') tag.remove();
      };
    }

    /* ------------------------------------------------------------------- glue */

    /** What the components need from the host, filled in by `apply`. */
    let runtime = { sessions: null, sidebarRight: null };

    /** The tab type's static face: a page type, so no address patterns. */
    function sourcesDefinition(t) {
      return {
        id: TAB_ID,
        kind: TAB_KIND,
        priority: 'extension',
        keepMounted: true,
        title: () => t('title'),
        guide: [
          {
            id: 'sources',
            order: 40,
            title: () => t('tab.guide.title'),
            description: () => t('tab.guide.description'),
          },
        ],
      };
    }

    function apply(ctx) {
      runtime = { sessions: ctx.sessions, sidebarRight: ctx.sidebarRight };
      ctx.effect(() => installStyles(), 'dsh-search-ui: styles');
      ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'dsh-search-ui: dictionaries');
      const t = ctx.locale.bind(NS);

      ctx.effect(
        () => ctx.sidebarRightTabs.register(sourcesDefinition(t)),
        'dsh-search-ui: tab type',
      );

      ctx.slots.inject('sidebar.right.pane.tab', () =>
        ctx.slots.register(
          {
            name: 'sidebar.right.pane.tab',
            key: TAB_ID,
            locale: NS,
            inject: () => ({ t }),
          },
          SourcesBody,
        ),
      );

      ctx.slots.inject('conversation.session.header.utilities', () =>
        ctx.slots.register(
          {
            name: 'conversation.session.header.utilities',
            id: 'search-sources',
            order: 40,
            locale: NS,
            inject: () => ({
              t,
              open: () => ctx.sidebarRight.openTab(TAB_KIND),
            }),
          },
          SourcesTrigger,
        ),
      );

      // The shipped generic web rows are replaced by this plugin's own: a keyed
      // slot keeps the lowest priority per key, so -1 shadows the shipped row at
      // 0 (a same-priority duplicate throws), and client.inject names
      // client-ui-tool so the shipped rows are registered before these.
      ctx.slots.inject('tool.call.toolview', () =>
        ctx.slots.register(
          {
            name: 'tool.call.toolview',
            key: 'web_search',
            // Keyed slots shadow by priority: the lowest priority renders, and a
            // same-priority duplicate throws. The shipped row sits at 0.
            priority: -1,
            locale: NS,
          },
          WebToolRow,
        ),
      );

      ctx.slots.inject('tool.call.toolview', () =>
        ctx.slots.register(
          {
            name: 'tool.call.toolview',
            key: 'web_fetch',
            priority: -1,
            locale: NS,
          },
          WebToolRow,
        ),
      );

      // One compact sources strip before each completed turn's action row.
      ctx.slots.inject('conversation.chat.turnTail', () =>
        ctx.slots.register(
          {
            name: 'conversation.chat.turnTail',
            id: 'search-sources-tail',
            order: 10,
            locale: NS,
          },
          TurnSourcesStrip,
        ),
      );
    }

    // The testing seam: pure folds and the registration constants, so the
    // self-test can drive fixtures without a browser (test/client-harness.mjs).
    const __logic = Object.freeze({
      extractSources,
      extractTurnSources,
      foldToolCalls,
      collectSources,
      turnSourcesView,
      summarizeSources,
      sourcesFromToolResult,
      queriesFromRaw,
      normalizeUrlKey,
      hostOf,
      titleFromUrl,
      cleanText,
      scanText,
      toHttpUrl,
      SourcesView,
      SourcesBody,
      SourceCard,
      WebToolRow,
      InlineExpanded,
      TurnSourcesStrip,
      TurnSourcesView,
      AvatarStack,
      tabId: TAB_ID,
      tabKind: TAB_KIND,
      tailId: 'search-sources-tail',
      maxSources: MAX_SOURCES,
      inlineMaxRows: INLINE_MAX_ROWS,
    });

    return {
      inject: ['slots', 'locale', 'sidebarRight', 'sidebarRightTabs', 'sessions'],
      apply,
      __logic,
    };
    })(require);

    /* ── voice: read an answer aloud ────────────────────────────────────── */
    const voice = (function (require) {

    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } = React;

    const NS = 'dsh-voice';
    const SLOT = 'conversation.chat.assistant-actions';
    /** Long answers are summarized by hand, not read for ten minutes. */
    const MAX_CHARS = 4000;

    /* ------------------------------------------------------------------ text */

    /**
     * Reduce one Markdown answer to the sentences a person would read out.
     *
     * Code, tables and images are presentation the voice cannot carry, so they
     * go; link and inline-code *content* is worth hearing, so only the delimiters
     * go. Whitespace collapses to single spaces, because the utterance engine
     * treats every run as a pause.
     * @param {unknown} text - Markdown source, of any type.
     * @returns {string} speakable script, capped at {@link MAX_CHARS}.
     */
    function speakable(text) {
      if (typeof text !== 'string' || text.trim() === '') return '';
      let out = text;

      // Fenced code blocks, including an unterminated one at the end.
      out = out.replace(/```[\s\S]*?(?:```|$)/g, ' ');
      out = out.replace(/~~~[\s\S]*?(?:~~~|$)/g, ' ');

      // Images are dropped whole (before links, or the `!` would survive).
      out = out.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
      out = out.replace(/!\[[^\]]*\]\[[^\]]*\]/g, ' ');

      // Links keep their label and lose the destination (and title).
      out = out.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
      out = out.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1');

      // Autolinks and bare URLs are never worth listening to.
      out = out.replace(/<((?:https?|mailto|ftp):[^>\s]+)>/gi, ' ');
      out = out.replace(/\b(?:https?|ftp):\/\/[^\s<>()]+/gi, ' ');

      // HTML comments and tags.
      out = out.replace(/<!--[\s\S]*?-->/g, ' ');
      out = out.replace(/<\/?[A-Za-z][^>\n]*>/g, ' ');

      // Inline code: keep the code, drop the ticks.
      out = out.replace(/`([^`\n]*)`/g, '$1');
      out = out.replace(/`+/g, ' ');

      // Whole-line presentation that has no spoken form.
      out = out.replace(/^[ \t]*\|.*\|[ \t]*$/gm, ' ');
      out = out.replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, '');
      out = out.replace(/^[ \t]{0,3}>[ \t]?/gm, '');
      out = out.replace(/^[ \t]{0,3}(?:(?:-[ \t]*){3,}|(?:\*[ \t]*){3,}|(?:_[ \t]*){3,})$/gm, ' ');
      out = out.replace(/^[ \t]*[-*+][ \t]+/gm, '');
      out = out.replace(/^[ \t]*\d+[.)][ \t]+/gm, '');

      // Emphasis and strikethrough marks, but not the words they mark.
      out = out.replace(/\*\*([^*]+)\*\*/g, '$1');
      out = out.replace(/__([^_]+)__/g, '$1');
      out = out.replace(/~~([^~]+)~~/g, '$1');
      out = out.replace(/\*([^*\n]+)\*/g, '$1');
      out = out.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,;:!?]|$)/g, '$1$2');
      out = out.replace(/[*~]+/g, ' ');
      out = out.replace(/(^|\s)_+/g, '$1');
      out = out.replace(/_+(\s|$)/g, '$1');

      out = out.replace(/\s+/g, ' ').trim();
      return truncateToSentence(out, MAX_CHARS);
    }

    /**
     * Cut text to `max` characters, preferring the last sentence end inside the
     * cut so a truncated answer never stops mid-thought. A word boundary is the
     * fallback when the whole cut is one sentence.
     * @param {unknown} text - text to cut.
     * @param {number} max - character budget.
     * @returns {string} the longest acceptable prefix.
     */
    function truncateToSentence(text, max) {
      const source = typeof text === 'string' ? text : '';
      const limit = Number.isFinite(max) && max > 0 ? Math.floor(max) : MAX_CHARS;
      if (source.length <= limit) return source;
      const head = source.slice(0, limit);
      // A sentence may end in punctuation followed by a closing quote/bracket.
      const boundary = /[.!?…。！？]["'”’)\]]*(?=\s|$)/g;
      let cut = -1;
      for (let match = boundary.exec(head); match !== null; match = boundary.exec(head)) {
        cut = match.index + match[0].length;
      }
      if (cut > 0) return head.slice(0, cut).trim();
      const space = head.lastIndexOf(' ');
      return (space > 0 ? head.slice(0, space) : head).trim();
    }

    /**
     * Choose one installed voice for the page language.
     *
     * Order: exact locale, then the same language (an `en-AU` page reads an
     * `en-GB` voice before a French one), then the first voice the browser
     * lists — which is what a person expects when the page language has no
     * voice at all.
     * @param {unknown} voices - `SpeechSynthesisVoice[]` (or array-like) from `getVoices()`.
     * @param {unknown} lang - a BCP-47 tag, normally `navigator.language`.
     * @returns {object|null} the chosen voice, or null when none exist.
     */
    function pickVoice(voices, lang) {
      const list = Array.isArray(voices) ? voices.filter((voice) => voice && typeof voice === 'object') : [];
      if (list.length === 0) return null;
      const languageOf = (voice) =>
        typeof voice.lang === 'string' ? voice.lang.toLowerCase().replace(/_/g, '-') : '';
      const wanted = typeof lang === 'string' ? lang.trim().toLowerCase().replace(/_/g, '-') : '';
      if (wanted !== '') {
        const exact = list.find((voice) => languageOf(voice) === wanted);
        if (exact) return exact;
        const wantedPrimary = wanted.split('-')[0];
        const primary = list.find((voice) => languageOf(voice).split('-')[0] === wantedPrimary);
        if (primary) return primary;
        // No voice for the page language at all: the browser's own first
        // listing is the most predictable choice.
        if (wantedPrimary !== 'en') return list[0];
      }
      const english = list.find((voice) => languageOf(voice).split('-')[0] === 'en');
      return english ?? list[0];
    }

    /**
     * Why the speaker control cannot be used, or null when it can.
     *
     * Kept pure so the "no voices" branch is asserted without a browser: a
     * browser without an engine, or with none of its (asynchronous) voices
     * installed yet, gets a disabled control that says why rather than a button
     * that swallows the click.
     * @param {{supported: boolean, voiceCount: number, hasText: boolean, hasScript: boolean}} state
     * @returns {'unsupported'|'noVoices'|'missing'|'noText'|null} the copy key for the reason.
     */
    function controlState(state) {
      if (!state || state.supported !== true) return 'unsupported';
      if (!(state.voiceCount > 0)) return 'noVoices';
      if (state.hasText !== true) return 'missing';
      if (state.hasScript !== true) return 'noText';
      return null;
    }

    /* ------------------------------------------------------------------ copy */

    const COPY_EN = {
      read: 'Read this answer aloud',
      stop: 'Stop reading aloud',
      unsupported: 'Reading aloud is unavailable: this browser has no speech synthesis.',
      noVoices: 'Reading aloud is unavailable: this browser reports no speech voices.',
      missing: 'This answer is no longer in the loaded conversation history.',
      noText: 'This answer has no text to read aloud.',
    };
    const COPY_ZH = {
      read: '朗读这条回答',
      stop: '停止朗读',
      unsupported: '无法朗读：此浏览器不支持语音合成。',
      noVoices: '无法朗读：此浏览器没有可用的语音。',
      missing: '这条回答已不在已加载的对话历史中。',
      noText: '这条回答没有可朗读的文字。',
    };

    /* ------------------------------------------------------------- utilities */

    /** Minimal observable snapshot store; React subscribes through it. */
    function createStore(initial) {
      let state = initial;
      const listeners = new Set();
      return {
        get: () => state,
        set(next) {
          state = next;
          for (const listener of [...listeners]) {
            try {
              listener();
            } catch (error) {
              console.error('[dsh-voice] subscriber failed', error);
            }
          }
        },
        subscribe(listener) {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
      };
    }

    /** The visible text of one assistant message: text blocks joined in order. */
    function assistantText(message) {
      const blocks = Array.isArray(message?.content) ? message.content : [];
      const parts = [];
      for (const block of blocks) {
        if (block && block.type === 'text' && typeof block.text === 'string') parts.push(block.text);
      }
      return parts.join('\n\n').trim();
    }

    /* ------------------------------------------------------------------ view */

    function VoiceGlyph({ speaking }) {
      if (speaking) {
        return h(
          'svg',
          { width: 15, height: 15, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true', focusable: 'false' },
          h('rect', { x: 3.4, y: 3.4, width: 9.2, height: 9.2, rx: 1.6, stroke: 'currentColor', strokeWidth: 1.3 }),
        );
      }
      return h(
        'svg',
        { width: 15, height: 15, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true', focusable: 'false' },
        h('path', {
          d: 'M3 6.2h2.1L8.2 3.7v8.6L5.1 9.8H3z',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          strokeLinejoin: 'round',
        }),
        h('path', { d: 'M10.3 6.1a2.8 2.8 0 0 1 0 3.8', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' }),
        h('path', { d: 'M12.1 4.6a5 5 0 0 1 0 6.8', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' }),
      );
    }

    /**
     * One speaker control for one finalized answer.
     * @param {object} props - owner `messageId`, injected face, locale `t`.
     */
    function VoiceAction(props) {
      const { messageId, sessionId } = props;
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      const { textFor, speak, stop, voicesState, speechState, supported } = props;

      const voiceList = useSyncExternalStore(voicesState.subscribe, voicesState.get, voicesState.get);
      const speech = useSyncExternalStore(speechState.subscribe, speechState.get, speechState.get);
      const speaking = speech.speaking === true && speech.messageId === messageId && speech.sessionId === sessionId;

      const text = useMemo(
        () => (typeof textFor === 'function' ? textFor(sessionId, messageId) : ''),
        [textFor, sessionId, messageId],
      );
      const script = useMemo(() => speakable(text), [text]);

      const reasonKey = controlState({
        supported,
        voiceCount: voiceList.length,
        hasText: text !== '',
        hasScript: script !== '',
      });
      const reason = reasonKey === null ? null : t(reasonKey);
      const disabled = reasonKey !== null;

      const label = speaking ? t('stop') : disabled ? reason : t('read');

      const onClick = useCallback(() => {
        if (speaking) {
          stop();
          return;
        }
        if (script === '') return;
        speak(script, { messageId, sessionId });
      }, [messageId, script, sessionId, speak, speaking, stop]);

      // Leaving the view — session switch, plugin reload, transcript unmount —
      // must not leave a voice talking to an empty room.
      const speakingRef = useRef(false);
      speakingRef.current = speaking;
      const stopRef = useRef(stop);
      stopRef.current = stop;
      const sessionRef = useRef(sessionId);
      useEffect(() => {
        if (sessionRef.current !== sessionId) {
          sessionRef.current = sessionId;
          stopRef.current();
        }
      }, [sessionId]);
      useEffect(() => () => {
        if (speakingRef.current) stopRef.current();
      }, []);

      return h(
        'button',
        {
          type: 'button',
          className: 'dsv-action',
          'data-dsh-voice': '',
          'data-speaking': speaking ? 'true' : undefined,
          'aria-label': label,
          title: label,
          disabled,
          onClick,
        },
        h(VoiceGlyph, { speaking }),
      );
    }

    /* ------------------------------------------------------------- lifecycle */

    /** Theme tokens only, so the control belongs to whatever theme is active. */
    const CSS = `
.dsv-action {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  padding: 6px;
  border: none;
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.dsv-action svg { width: 15px; height: 15px; display: block; }
@media (hover: hover) {
  .dsv-action:hover:not(:disabled) {
    background: var(--dsw-alias-interactive-bg-hover);
    color: var(--dsw-alias-label-primary);
  }
}
.dsv-action:focus-visible {
  outline: 2px solid var(--dsw-alias-label-primary);
  outline-offset: 1px;
}
.dsv-action[data-speaking='true'] {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.dsv-action:disabled {
  cursor: default;
  opacity: 0.4;
}
@media (prefers-reduced-motion: reduce) {
  .dsv-action { transition: none; }
}
`;

    /**
     * @param ctx - Cordis client context carrying `slots`, `locale` and `sessions`.
     */
    function apply(ctx) {
      const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
      const Utterance = typeof window !== 'undefined' ? window.SpeechSynthesisUtterance : undefined;
      const supported = Boolean(synth && typeof Utterance === 'function');

      const voicesState = createStore([]);
      const speechState = createStore({ speaking: false, messageId: null, sessionId: null });
      /** The utterance currently owned by the plugin; null when silent. */
      let current = null;

      ctx.effect(() => {
        const selector = 'style[data-plugin-css="@local/dsh-voice/voice.css"]';
        if (typeof document === 'undefined' || document.querySelector(selector) !== null) return () => {};
        const tag = document.createElement('style');
        tag.dataset.plugin = '@local/dsh-voice';
        tag.dataset.pluginCss = '@local/dsh-voice/voice.css';
        tag.textContent = CSS;
        document.head.appendChild(tag);
        return () => {
          tag.remove();
        };
      }, 'dsh-voice: styles');

      const readVoices = () => {
        if (!synth || typeof synth.getVoices !== 'function') return [];
        try {
          return Array.from(synth.getVoices() ?? []);
        } catch {
          return [];
        }
      };

      const stop = () => {
        current = null;
        speechState.set({ speaking: false, messageId: null, sessionId: null });
        if (!synth) return;
        try {
          synth.cancel();
        } catch (error) {
          console.error('[dsh-voice] cancel failed', error);
        }
      };

      const speak = (text, { messageId, sessionId }) => {
        if (!supported || typeof text !== 'string' || text === '') return false;
        stop();
        const lang =
          typeof navigator !== 'undefined' && typeof navigator.language === 'string' && navigator.language !== ''
            ? navigator.language
            : 'en';
        const utterance = new Utterance(text);
        const voice = pickVoice(readVoices(), lang);
        if (voice) {
          utterance.voice = voice;
          if (typeof voice.lang === 'string' && voice.lang !== '') utterance.lang = voice.lang;
        } else {
          utterance.lang = lang;
        }
        utterance.rate = 1;
        utterance.pitch = 1;
        const token = {};
        current = { token, messageId, sessionId };
        const settle = () => {
          if (current === null || current.token !== token) return;
          current = null;
          speechState.set({ speaking: false, messageId: null, sessionId: null });
        };
        utterance.onend = settle;
        utterance.onerror = (event) => {
          const code = event?.error;
          if (code !== 'interrupted' && code !== 'canceled') console.error('[dsh-voice] speech failed', code);
          settle();
        };
        speechState.set({ speaking: true, messageId, sessionId });
        try {
          synth.speak(utterance);
        } catch (error) {
          console.error('[dsh-voice] speak failed', error);
          settle();
          return false;
        }
        return true;
      };

      // Voices arrive asynchronously in every engine that matters; the control
      // stays disabled until the first list is non-empty.
      ctx.effect(() => {
        voicesState.set(readVoices());
        if (!synth) return () => {};
        const refresh = () => voicesState.set(readVoices());
        const canListen = typeof synth.addEventListener === 'function';
        if (canListen) {
          try {
            synth.addEventListener('voiceschanged', refresh);
          } catch {
            /* engine without event targets: fall through to onvoiceschanged */
          }
        }
        const usesHandler = !canListen || typeof synth.onvoiceschanged !== 'undefined';
        if (usesHandler) {
          try {
            synth.onvoiceschanged = refresh;
          } catch {
            /* ignore */
          }
        }
        // Asking once more covers engines that populate only after the call.
        refresh();
        return () => {
          if (canListen) {
            try {
              synth.removeEventListener('voiceschanged', refresh);
            } catch {
              /* ignore */
            }
          }
          if (usesHandler) {
            try {
              if (synth.onvoiceschanged === refresh) synth.onvoiceschanged = null;
            } catch {
              /* ignore */
            }
          }
          stop();
        };
      }, 'dsh-voice: voices and speech');

      /** messageId -> text, rebuilt only when the Session event window changes. */
      const textCaches = new Map();

      const textFor = (sessionId, messageId) => {
        if (typeof sessionId !== 'string' || typeof messageId !== 'string') return '';
        const binding = ctx.sessions?.binding?.(sessionId);
        const source = binding?.eventSource;
        if (!source || typeof source.getSnapshot !== 'function') return '';
        let snapshot;
        try {
          snapshot = source.getSnapshot();
        } catch {
          return '';
        }
        const revision = snapshot?.revision;
        let map = null;
        const cached = textCaches.get(sessionId);
        if (cached !== undefined && cached.revision === revision && Number.isFinite(revision)) map = cached.map;
        if (map === null) {
          map = new Map();
          for (const entry of snapshot?.entries ?? []) {
            if (!entry || entry.type !== 'event') continue;
            const event = entry.event;
            if (!event || event.type !== 'assistant/message') continue;
            const message = event.data?.message;
            const id = message?.id;
            if (typeof id !== 'string' || id === '') continue;
            map.set(id, assistantText(message));
          }
          if (Number.isFinite(revision)) {
            if (textCaches.size > 24) textCaches.clear();
            textCaches.set(sessionId, { revision, map });
          }
        }
        return map.get(messageId) ?? '';
      };

      ctx.effect(
        () => ctx.locale.register(NS, { en: COPY_EN, zh: COPY_ZH }),
        'dsh-voice: dictionaries',
      );
      const t = ctx.locale.bind(NS);

      ctx.slots.inject(SLOT, () =>
        ctx.slots.register(
          {
            name: SLOT,
            id: 'dsh-voice',
            order: 20,
            locale: NS,
            inject: (sessionId) => ({
              sessionId,
              t,
              textFor,
              speak,
              stop,
              voicesState,
              speechState,
              supported,
            }),
          },
          VoiceAction,
        ),
      );
    }

    return {
      inject: ['slots', 'locale', 'sessions'],
      apply,
      // The testing seam: pure decisions, no React, no browser.
      __logic: {
        speakable,
        truncateToSentence,
        pickVoice,
        controlState,
        copy: { en: { ...COPY_EN }, zh: { ...COPY_ZH } },
      },
    };
    })(require);

    /* ── bundle configuration page ────────────────────────────────────────
     * Rendered on Softshell's page in the Plugins page. It reports what this
     * pack changes today; per-item switches land in 0.2 once each surface
     * reads its own flag instead of a constant.
     */
    const CONFIG_KEY = 'dsh-softshell';
    const CONFIG_NS = 'softshell';
    const CONFIG_GROUPS = [
      {
        id: 'declutter',
        title: 'Declutter',
        detail: 'Host chrome this pack takes out of the conversation.',
        items: [
          'Trajectory view and the extra-views menu',
          'Model picker in the composer',
          'Access-mode picker in the composer',
          'Agent-preset label in the session header',
          'Turn, token and cache pills under the composer',
          'Context meter',
          'Branch-into-a-new-conversation action',
          'Per-turn “Edited N files” card',
        ],
      },
      {
        id: 'surface',
        title: 'Home surface',
        detail: 'What a new conversation offers instead of the coding empty state.',
        items: [
          'Four personal starters that fill and send the composer',
          'Workspace folder chip in the composer tool row',
          'Hero workspace and preset selectors replaced',
        ],
      },
      {
        id: 'search',
        title: 'Sources',
        detail: 'How web work is shown.',
        items: [
          'Sources tab in the right sidebar',
          'Inline search row with a “Read N pages” disclosure',
          'Per-turn sources band under the answer',
        ],
      },
      {
        id: 'voice',
        title: 'Voice',
        detail: 'Listening and reading aloud.',
        items: [
          'Speaker control on every finished answer',
          'No-voices state explained instead of a dead button',
        ],
      },
      {
        id: 'ambient',
        title: 'Ambient',
        detail: 'Host-side grounding supplied by this same package.',
        items: [
          'One “Right now” line with the local time, and the user’s place once set',
          'ambient_place and ambient_weather tools',
        ],
      },
    ];

    /** The bundle's page body; the Plugins page asks for this once per view. */
    function SoftshellConfig(props) {
      const view = props && props.view;
      const t = typeof props.t === 'function' ? props.t : (key) => key;
      if (view === 'summary') {
        return h('span', null, t('summary'));
      }
      return h(
        'div',
        { className: 'dsh-softshell-config' },
        h('p', { className: 'dsh-softshell-config__lead' }, t('lead')),
        CONFIG_GROUPS.map((group) =>
          h(
            'section',
            { key: group.id, className: 'dsh-softshell-config__group' },
            h('h4', { className: 'dsh-softshell-config__title' }, group.title),
            h('p', { className: 'dsh-softshell-config__detail' }, group.detail),
            h(
              'ul',
              { className: 'dsh-softshell-config__items' },
              group.items.map((item) => h('li', { key: item }, item)),
            ),
          ),
        ),
        h('p', { className: 'dsh-softshell-config__note' }, t('note')),
      );
    }

    const CONFIG_COPY = {
      en: {
        summary: 'Personal surface for DeepSeek Harness: declutter, home starters, sources, voice, ambient.',
        lead: 'Softshell changes what the conversation looks like without changing what the assistant can do.',
        note: 'Per-item switches arrive in 0.2. For now the whole pack is one switch in the list above.',
      },
      zh: {
        summary: 'DeepSeek Harness 的个人界面：精简外壳、起始建议、来源、朗读与在地信息。',
        lead: 'Softshell 只改变对话呈现方式，不改变助手能做什么。',
        note: '逐项开关将在 0.2 提供；目前整个包在列表中是一个开关。',
      },
    };

    /**
     * Mount the configuration page plus its stylesheet.
     * @param {object} ctx - the client plugin context.
     */
    function applyConfig(ctx) {
      ctx.effect(() => ctx.locale.register(CONFIG_NS, CONFIG_COPY), 'dsh-softshell: config copy');
      ctx.effect(() => {
        if (typeof document === 'undefined') return () => {};
        const attr = 'data-dsh-softshell-config';
        if (document.querySelector('style[' + attr + ']') !== null) return () => {};
        const tag = document.createElement('style');
        tag.setAttribute(attr, '');
        tag.textContent = [
          '.dsh-softshell-config{display:flex;flex-direction:column;gap:16px;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-secondary)}',
          '.dsh-softshell-config__lead{margin:0;color:var(--dsw-alias-label-secondary)}',
          '.dsh-softshell-config__group{display:flex;flex-direction:column;gap:4px}',
          '.dsh-softshell-config__title{margin:0;font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}',
          '.dsh-softshell-config__detail{margin:0;color:var(--dsw-alias-label-tertiary)}',
          '.dsh-softshell-config__items{margin:4px 0 0;padding-left:18px;color:var(--dsw-alias-label-secondary)}',
          '.dsh-softshell-config__note{margin:8px 0 0;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);font-size:12px}',
        ].join('\n');
        document.head.appendChild(tag);
        return () => {
          tag.remove();
        };
      }, 'dsh-softshell: config styles');
      ctx.slots.inject('plugins.bundle.config', () =>
        ctx.slots.register(
          {
            name: 'plugins.bundle.config',
            key: CONFIG_KEY,
            locale: CONFIG_NS,
            inject: () => ({ t: ctx.locale.bind(CONFIG_NS) }),
          },
          SoftshellConfig,
        ),
      );
    }

    const PARTS = [
      ['surface', surface],
      ['sources', sources],
      ['voice', voice],
    ];

    /** Union of the services the parts ask for, resolved once at mount. */
    const inject = Array.from(new Set(PARTS.flatMap(([, part]) => part.inject ?? [])));

    /**
     * Mount every part. One failing surface must not take the others down: each
     * runs behind its own guard and reports its failure once.
     * @param {object} ctx - the client plugin context.
     */
    function apply(ctx) {
      for (const [name, part] of PARTS) {
        try {
          part.apply(ctx);
        } catch (error) {
          console.error('[dsh-softshell] ' + name + ' failed to apply', error);
        }
      }
      try {
        applyConfig(ctx);
      } catch (error) {
        console.error('[dsh-softshell] config page failed to apply', error);
      }
    }

    const __logic = Object.assign(
      {},
      surface.__logic,
      sources.__logic,
      voice.__logic,
      { configGroups: CONFIG_GROUPS, configKey: CONFIG_KEY, SoftshellConfig },
    );

    return {
      inject,
      apply,
      __logic,
    };
  },
});
