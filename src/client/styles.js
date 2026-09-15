// pomasa-studio styles — self-contained design kit on DSW alias tokens.
// Every color is a --dsw-alias-* token so light/dark follow the host.
// Type/space/radius/state are tuned to feel like a library, not ad-hoc.
export const CSS = `
.ps-root {
  color: var(--dsw-alias-label-primary);
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  font-feature-settings: "cv02", "cv03", "cv04";
}
.ps-root *, .ps-root *::before, .ps-root *::after { box-sizing: border-box; }
.ps-root button, .ps-root input, .ps-root textarea, .ps-root select {
  font: inherit; color: inherit;
}
.ps-root a { color: var(--dsw-alias-brand-primary); text-decoration: none; }
.ps-root a:hover { text-decoration: underline; }

/* ---------- typography scale ---------- */
.ps-h1 { font-size: 24px; font-weight: 650; letter-spacing: -0.02em; margin: 0 0 4px; }
.ps-h2 { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; margin: 0 0 6px; }
.ps-sub { color: var(--dsw-alias-label-dimmed); font-size: 14px; margin: 0 0 24px; }
.ps-muted { color: var(--dsw-alias-label-dimmed); font-size: 14px; }
.ps-caption { color: var(--dsw-alias-label-caption); font-size: 12.5px; }

/* ---------- surfaces ---------- */
.ps-card {
  background: var(--dsw-alias-bg-layer-1);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  padding: 18px 20px;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}
.ps-card.clickable { cursor: pointer; transition: border-color 150ms, box-shadow 150ms; }
.ps-card.clickable:hover { border-color: var(--dsw-alias-border-l3); box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06); }
.ps-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px;
  letter-spacing: -0.01em;
}
.ps-card-title .ps-dot { flex: none; }
.ps-card-title-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ps-card-title:not(:has(.ps-card-title-text)) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ps-card-desc {
  color: var(--dsw-alias-label-dimmed);
  font-size: 13.5px;
  line-height: 1.55;
  margin: 0 0 14px;
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
.ps-card-footer {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 14px;
  flex-wrap: nowrap;
  min-width: 0;
  overflow: hidden;
}
.ps-card-footer > .ps-muted,
.ps-card-footer > .ps-caption,
.ps-card-footer > .ps-badge {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ps-card-footer > .spacer { flex: 1 1 0; min-width: 8px; }
.ps-card-footer > .ps-btn,
.ps-card-footer > button { flex: none; }

/* ---------- buttons ---------- */
.ps-btn {
  border: 0;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease, box-shadow 140ms ease, filter 140ms ease;
  user-select: none;
  white-space: nowrap;
}
.ps-btn:not(:disabled):hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 12%, var(--dsw-alias-bg-layer-2));
  color: var(--dsw-alias-label-primary);
}
.ps-btn:active { transform: translateY(0.5px); }
.ps-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.ps-btn.primary {
  background: var(--dsw-alias-button-primary-fill);
  border: 0;
  color: var(--dsw-alias-label-primary-foreground);
  font-weight: 550;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}
.ps-btn.primary:not(:disabled):hover { background: var(--dsw-alias-button-primary-hover); color: var(--dsw-alias-label-primary-foreground); }
.ps-ui-btn--text.ps-ui-btn--light.ghost,
.ps-btn.ghost:not(.ps-ui-btn--icon) {
  background: var(--dsw-alias-bg-layer-2);
  border: 1px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
}
.ps-ui-btn--text.ps-ui-btn--light.ghost:not(:disabled):hover,
.ps-btn.ghost:not(.ps-ui-btn--icon):not(:disabled):hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 12%, var(--dsw-alias-bg-layer-2));
  border-color: var(--dsw-alias-border-l3);
  color: var(--dsw-alias-label-primary);
}
.ps-btn-danger { color: var(--dsw-alias-state-error-primary) !important; }
.ps-btn-danger:not(:disabled):hover { background: var(--dsw-alias-interactive-bg-hover-danger) !important; filter: none !important; box-shadow: none !important; }
.ps-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; filter: none; }

/* unified button module (text/icon × dark/light) */
.ps-ui-btn--text.ps-ui-btn--dark {
  background: var(--dsw-alias-button-primary-fill);
  border: 0;
  color: var(--dsw-alias-label-primary-foreground);
  font-weight: 550;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}
.ps-ui-btn--text.ps-ui-btn--dark:not(:disabled):hover { background: var(--dsw-alias-button-primary-hover); color: var(--dsw-alias-label-primary-foreground); }
.ps-ui-btn--text.ps-ui-btn--light {
  background: var(--dsw-alias-bg-layer-2);
  border: 1px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
}
.ps-ui-btn--text.ps-ui-btn--light:not(:disabled):hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 12%, var(--dsw-alias-bg-layer-2));
  border-color: var(--dsw-alias-border-l3);
  color: var(--dsw-alias-label-primary);
}
.ps-ui-btn--icon.ps-ui-btn--dark {
  width: 32px; height: 32px; min-width: 32px; padding: 0 !important;
  border: 0; border-radius: 50%;
  background: var(--dsw-alias-label-primary);
  color: var(--dsw-alias-label-primary-foreground);
  display: inline-flex; align-items: center; justify-content: center;
  line-height: 0; flex: none;
}
.ps-ui-btn--icon.ps-ui-btn--dark:not(:disabled):hover { filter: brightness(1.08); background: var(--dsw-alias-label-primary); }
.ps-ui-btn--icon.ps-ui-btn--dark .ps-icon { pointer-events: none; color: inherit; }
.ps-ui-btn--icon.ps-ui-btn--light,
.ps-ui-btn--icon.ps-ui-btn--light.ghost {
  background: transparent;
  border: 0;
  color: var(--dsw-alias-label-secondary);
}
.ps-ui-btn--icon.ps-ui-btn--light:not(:disabled):hover,
.ps-ui-btn--icon.ps-ui-btn--light.ghost:not(:disabled):hover {
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 12%, var(--dsw-alias-bg-layer-2));
  color: var(--dsw-alias-label-primary);
}

.ps-icon { display: inline-flex; align-items: center; justify-content: center; line-height: 0; color: inherit; vertical-align: middle; }
.ps-icon svg { display: block; }
.ps-icon-btn { padding: 4px 6px !important; min-width: 28px; line-height: 0; display: inline-flex; align-items: center; justify-content: center; }
.ps-icon-btn .ps-icon { pointer-events: none; }

/* ---------- UI hierarchy (z from hierachy/stack.js inline --ps-z) ---------- */
.ps-hier-main {
  --ps-z-part: 1;
  --ps-z-part-active: 3;
  position: relative;
  isolation: isolate;
  height: 100%;
  width: 100%;
}
.ps-hier { position: relative; isolation: isolate; }
.ps-hier-overlay { position: fixed; isolation: isolate; }
#ps-overlay-root { position: fixed; top: 0; left: 0; width: 0; height: 0; overflow: visible; pointer-events: none; z-index: 100; }
#ps-overlay-root > * { pointer-events: auto; }

.ps-modal-backdrop { position: fixed; inset: 0; background: var(--dsw-alias-bg-mask-2, rgba(0, 0, 0, 0.4)); display: flex; align-items: center; justify-content: center; padding: 24px; }

.ps-part-desc { position: relative; display: inline-flex; align-items: center; flex: none; margin-left: 6px; vertical-align: middle; outline: none; }
.ps-part-desc-icon { color: var(--dsw-alias-label-caption); cursor: help; }
.ps-part-desc:hover .ps-part-desc-icon,
.ps-part-desc:focus-visible .ps-part-desc-icon { color: var(--dsw-alias-label-secondary); }
.ps-part-desc-tip {
  min-width: 180px; max-width: 300px; padding: 8px 10px; border-radius: 8px;
  background: var(--dsw-alias-bg-layer-3, var(--dsw-alias-bg-base));
  border: 1px solid var(--dsw-alias-border-l2);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  font-size: 12.5px; line-height: 1.45; color: var(--dsw-alias-label-secondary);
  white-space: pre-wrap; text-align: left; pointer-events: none;
}
.ps-part-desc-tip--fixed { position: fixed; transform: translateX(-50%); z-index: var(--ps-z, 1); }
.ps-part-desc-line { display: block; }
.ps-part-desc-line + .ps-part-desc-line { margin-top: 4px; }
.ps-part-desc-anchor { display: inline-flex; width: 100%; }
.ps-part-desc-anchor > .ps-btn { width: 100%; pointer-events: none; }
.ps-studio-mode { padding: 8px 12px 10px; display: flex; flex-direction: column; }
.ps-mode-picker .ps-mode-segment { margin-top: 4px; }
.ps-mode-picker-hint { margin: 12px 0 0; font-size: 12.5px; line-height: 1.45; color: var(--dsw-alias-label-caption); }
.ps-mode-desc-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.ps-mode-desc {
  padding: 10px 12px; border-radius: 10px;
  border: 1px solid var(--dsw-alias-line-divider-default);
  background: var(--dsw-alias-fill-secondary, rgba(0, 0, 0, 0.03));
}
.ps-mode-desc--active {
  border-color: var(--dsw-alias-brand-primary, #4f46e5);
  background: var(--dsw-alias-fill-brand-secondary, rgba(79, 70, 229, 0.08));
}
.ps-mode-desc-title { font-weight: 600; font-size: 13px; margin-bottom: 6px; color: var(--dsw-alias-label-primary); }
.ps-mode-desc-line { font-size: 12.5px; line-height: 1.45; color: var(--dsw-alias-label-secondary); }
.ps-mode-desc-line + .ps-mode-desc-line { margin-top: 4px; }
.ps-mode-segment { display: flex; gap: 6px; }
.ps-mode-segment .ps-btn { flex: 1 1 0; min-width: 0; }

/* ---------- footer startup (DSH footArea / sidebar.footer.action) ---------- */
/* Mirror native Settings trigger (.VOzbGW_trigger) so icon+label share the same box. */
.dk-block { display: none !important; }
.hHd-Xa_footerActions { width: 100%; min-width: 0; }
.ps-startup-btn {
  box-sizing: border-box;
  display: flex; align-items: center; gap: 8px; flex: none;
  width: calc(100% + 8px); height: 34px;
  margin: 4px -4px; padding: 6px 2px 6px 10px;
  border: none; border-radius: 12px; background: transparent; overflow: hidden;
  color: var(--dsw-alias-label-primary); cursor: pointer;
  font-family: inherit; font-size: 14px; font-weight: 400; line-height: 22px;
  text-align: left;
}
.ps-startup-btn:hover,
.ps-startup-btn.ps-startup-btn--on { background: var(--dsw-alias-interactive-bg-hover); }
.ps-startup-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.ps-startup-btn.ps-startup-btn--rail {
  border-radius: 50%; justify-content: center; gap: 0;
  width: 36px; height: 36px; margin: 8px 0 10px; padding: 0;
}
.ps-startup-btn [data-slot="pomasa.trigger"] { display: contents; }
.ps-startup-btn-icon,
.ps-startup-btn .ps-icon { flex: none; color: currentColor; line-height: 0; }
.ps-startup-btn-label { white-space: nowrap; overflow: hidden; color: inherit; font: inherit; }

/* ---------- badges / status ---------- */
.ps-badge {
  display: inline-flex; align-items: center; gap: 6px;
  border-radius: 999px; padding: 2px 8px;
  font-size: 11.5px; font-weight: 500;
  border: 1px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-dimmed);
  background: var(--dsw-alias-bg-layer-2);
  flex: none; max-width: 100%;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ps-badge .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.ps-badge.running { color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-border-l3); }
.ps-badge.generating { color: var(--dsw-alias-state-warn-primary); }
.ps-badge.completed, .ps-badge.ok { color: var(--dsw-alias-state-success-primary); }
.ps-badge.failed, .ps-badge.err { color: var(--dsw-alias-state-error-primary); }
.ps-badge.idle { color: var(--dsw-alias-label-dimmed); }

/* ---------- list grid (legacy) ---------- */
.ps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }

/* ---------- empty states ---------- */
.ps-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 56px 24px; text-align: center; gap: 10px; color: var(--dsw-alias-label-dimmed); border: 1px dashed var(--dsw-alias-border-l2); border-radius: 14px; background: var(--dsw-alias-bg-layer-1); }
.ps-empty-glyph { font-size: 36px; line-height: 1; opacity: 0.5; }
.ps-empty-title { font-size: 16px; font-weight: 600; color: var(--dsw-alias-label-primary); }

/* ---------- forms ---------- */
.ps-field { margin-bottom: 16px; }
.ps-field label { display: block; font-size: 13.5px; font-weight: 500; color: var(--dsw-alias-label-primary); margin-bottom: 6px; }
.ps-field .hint { color: var(--dsw-alias-label-caption); font-size: 12.5px; margin-top: 5px; }
.ps-input, .ps-textarea, .ps-select {
  width: 100%;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}
.ps-input::placeholder, .ps-textarea::placeholder { color: var(--dsw-alias-label-caption); }
.ps-input:hover, .ps-textarea:hover, .ps-select:hover { border-color: var(--dsw-alias-border-l3); }
.ps-input:focus, .ps-textarea:focus, .ps-select:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, transparent); }
.ps-textarea { min-height: 88px; resize: vertical; line-height: 1.55; }
.ps-form-row { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); }
.ps-form-row > * { min-width: 0; }

/* ---------- stage strip ---------- */
.ps-stages { display: flex; flex-wrap: wrap; gap: 4px; overflow: hidden; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; padding: 4px; min-width: 0; }
.ps-stage { flex: 1 1 108px; min-width: 0; max-width: 100%; padding: 10px 12px; cursor: pointer; border-radius: 8px; transition: background 140ms ease; position: relative; }
.ps-stage:hover { background: var(--dsw-alias-interactive-bg-hover); }
.ps-stage.on { background: var(--dsw-alias-bg-layer-2); box-shadow: inset 0 0 0 1.5px var(--dsw-alias-state-business-primary); }
.ps-stage-on { position: absolute; top: 0; left: 8px; right: 8px; height: 2.5px; border-radius: 0 0 4px 4px; }
.ps-stage-name { font-size: 13.5px; font-weight: 600; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
.ps-stage-name:hover { text-decoration: underline; }
.ps-stage-count { font-size: 12px; color: var(--dsw-alias-label-caption); }

/* ---------- scroll frame / scrollbox ---------- */
.ps-scroll-frame {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  position: relative;
  scrollbar-gutter: stable;
}
.ps-scrollbox {
  width: 100%;
  height: auto;
  box-sizing: border-box;
  overflow: visible;
  position: relative;
}
.ps-scrollbox--canvas {
  width: max-content;
  height: max-content;
  overflow: visible;
}
.ps-scrollbox-canvas { position: relative; box-sizing: border-box; }
.ps-scrollbox--canvas .ps-scrollbox-canvas {
  width: 1440px;
  min-width: 1440px;
  height: 960px;
  box-sizing: border-box;
}
.ps-scrollbox--canvas .ps-canvas {
  width: 1400px;
  min-width: 1400px;
  max-width: none;
  margin: 20px;
}

/* ---------- workflow canvas (phase 2) ---------- */
.ps-canvas { margin: 20px 0 0 20px; box-sizing: border-box; width: calc(100% - 20px); max-width: calc(100% - 20px); min-width: 0; }
.ps-orch-shell {
  border: 1px solid var(--dsw-alias-border-l2); border-radius: 14px;
  background: var(--dsw-alias-bg-layer-1); padding: 12px 14px 14px; margin-bottom: 12px;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}
.ps-orch-shell:last-child { margin-bottom: 0; }
.ps-orch-shell.on { box-shadow: inset 0 0 0 1.5px var(--dsw-alias-state-business-primary); background: var(--dsw-alias-bg-layer-2); }
.ps-orch-shell.alive { border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, var(--dsw-alias-border-l2)); }
.ps-orch-head { margin-bottom: 10px; min-width: 0; }
.ps-orch-title-row { display: flex; align-items: center; gap: 6px; cursor: pointer; margin-bottom: 8px; min-width: 0; }
.ps-orch-title { font-size: 15px; font-weight: 650; }
.ps-orch-actions { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
.ps-orch-body { border-top: 1px solid var(--dsw-alias-border-l2); padding-top: 10px; min-width: 0; }
.ps-canvas-stages-wrap {
  position: relative;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.ps-canvas-stages-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 28px;
  row-gap: 16px;
  width: 100%;
  box-sizing: border-box;
}
.ps-canvas-stage-slot {
  flex: 0 0 auto;
  width: max-content;
  max-width: 320px;
  min-width: 0;
  align-self: center;
}
.ps-canvas-stage-slot .ps-node.stage {
  display: block;
  width: max-content;
  max-width: 100%;
  box-sizing: border-box;
}
.ps-canvas-bridges {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}
.ps-canvas-bridges polyline {
  fill: none;
  stroke: var(--dsw-alias-border-l3);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ps-canvas-stages { display: flex; align-items: stretch; gap: 0; padding: 2px 0 4px; box-sizing: border-box; flex-wrap: wrap; width: 100%; min-width: 0; }
.ps-canvas-edge { flex: none; width: 24px; align-self: center; height: 2px; background: var(--dsw-alias-border-l3); margin: 0 2px; border-radius: 1px; }
.ps-node {
  flex: none; 
  border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px;
  background: var(--dsw-alias-bg-layer-2); padding: 10px 12px; cursor: pointer;
  transition: border-color 140ms, box-shadow 140ms, background 140ms;
  box-sizing: border-box;
}
.ps-node.stage {
  flex: none;
  height: auto;
  box-sizing: border-box;
}
.ps-node.stage .ps-node-head {
  flex-wrap: wrap;
  align-items: flex-start;
  width: auto;
}
.ps-node.stage .ps-node-head-main {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  min-width: 0;
}
.ps-node:hover { border-color: var(--dsw-alias-border-l3); background: var(--dsw-alias-interactive-bg-hover); }
.ps-node.on { box-shadow: inset 0 0 0 1.5px var(--dsw-alias-state-business-primary); background: var(--dsw-alias-bg-layer-3, var(--dsw-alias-bg-layer-2)); }
.ps-node.alive { border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, var(--dsw-alias-border-l2)); }
.ps-node-head { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; min-width: 0; }
.ps-node-head-main {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 auto;
  min-width: min(100%, calc(7px + 6px + 4ch));
  max-width: 100%;
}
.ps-node.stage .ps-node-head-main > .ps-dot {
  flex: none;
  align-self: center;
}
.ps-node-title { font-size: 13.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
.ps-node.stage .ps-node-head-main > .ps-node-title {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 260px;
}
.ps-node.stage .ps-node-head > .ps-badge.running {
  flex: 0 1 auto;
  max-width: 100%;
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
  word-break: break-word;
  align-self: flex-start;
}
.ps-node-meta { font-size: 12px; color: var(--dsw-alias-label-caption); margin-bottom: 8px; }
.ps-node-actions { display: flex; flex-wrap: wrap; gap: 4px; }

/* ---------- agent chat (native ConversationRoot dock) ---------- */
.ps-part-body-chat {
  overflow: hidden; display: flex; flex-direction: column; flex: 1; min-height: 0; min-width: 0;
}
.ps-native-conversation-host {
  flex: 1; min-height: 0; min-width: 0; display: flex; flex-direction: column; overflow: hidden;
}
.ps-native-conversation-seat { flex: 1; min-height: 0; min-width: 0; }
.ps-native-conversation-placeholder { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; }
body.ps-native-conversation-docked [data-slot="conversation.session.header"] { display: none !important; }
.ps-native-conversation-root { overflow: hidden !important; display: flex !important; flex-direction: column !important; }
.ps-native-conversation-root[data-phase="active"] { overflow: hidden !important; }
.ps-native-conversation-root [data-conversation-scroll] { flex: 1 !important; min-height: 0 !important; }
.ps-native-conversation-root [data-composer-seat] { flex: none !important; }
.ps-native-conversation-root .composerStack { max-width: 100%; }
body.ps-native-conversation-docked.ps-native-composer-locked [data-composer-seat] {
  pointer-events: none;
  opacity: 0.55;
}
.ps-chat-empty { color: var(--dsw-alias-label-dimmed); font-size: 13px; padding: 12px; }

/* shell.overlay workbench panel — bounded to the center column, the DSH
   sidebar stays visible and clickable underneath (click-through root).
   Entry: footer startup button (sidebar.footer.action → footArea). */
.ps-shell-root { position: absolute; inset: 0; display: flex; pointer-events: none !important; }
.ps-shell-nav { flex: 0 0 auto; }
.ps-shell-panel { flex: 1; min-width: 0; pointer-events: auto; background: var(--dsw-alias-bg-base); border-left: 1px solid var(--dsw-alias-border-l2); display: flex; min-height: 0; overflow: hidden; }

/* ---------- modal ---------- */
.ps-modal { background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l2); border-radius: 14px; width: min(760px, 100%); max-height: 82vh; display: flex; flex-direction: column; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.22); position: relative; z-index: 1; }
.ps-modal-wide { width: min(980px, 100%); max-height: 88vh; }
.ps-secondary-window {
  width: min(1200px, calc(100vw - 48px));
  height: min(860px, calc(100vh - 48px));
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
}
.ps-secondary-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0;
}
.ps-secondary-body .ps-scroll-frame { flex: 1; min-height: 0; }
.ps-expand-scroll { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
.ps-expand-stack { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
.ps-expand-canvas { flex: 1 1 0; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
.ps-expand-details { flex: 1 1 0; min-height: 120px; overflow: hidden; display: flex; flex-direction: column; border-top: 1px solid var(--dsw-alias-border-l2); }
.ps-expand-details .ps-scroll-frame { flex: 1; min-height: 0; }
.ps-artifact-body { max-height: 72vh; }
.ps-modal-head { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-bottom: 1px solid var(--dsw-alias-border-l2); }
.ps-modal-body { padding: 20px 26px; overflow: auto; line-height: 1.7; font-size: 14.5px; }
.ps-modal-body h1, .ps-modal-body h2, .ps-modal-body h3 { line-height: 1.3; margin: 1.1em 0 0.45em; }
.ps-modal-body h1 { font-size: 21px; } .ps-modal-body h2 { font-size: 18px; } .ps-modal-body h3 { font-size: 15px; }
.ps-code { background: var(--dsw-alias-bg-layer-2); padding: 1px 6px; border-radius: 5px; font-size: 13px; }
.ps-pre { background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; padding: 14px; overflow: auto; font-size: 13px; line-height: 1.6; }

/* ---------- artifact cards ---------- */
.ps-artlist { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr)); min-width: 0; margin: 12px; }
.ps-art { cursor: pointer; transition: border-color 150ms, box-shadow 150ms; min-width: 0; overflow: hidden; }
.ps-art:hover { border-color: var(--dsw-alias-border-l3); box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06); }
.ps-art.on { border-color: var(--dsw-alias-brand-primary); }
.ps-art-title {
  font-size: 14.5px;
  font-weight: 600;
  margin: 0 0 2px;
  letter-spacing: -0.01em;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ps-art-sub {
  font-size: 13px;
  color: var(--dsw-alias-label-dimmed);
  margin-bottom: 6px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ps-art-sum {
  font-size: 13.5px;
  color: var(--dsw-alias-label-primary-dimmed, var(--dsw-alias-label-dimmed));
  margin-bottom: 10px;
  line-height: 1.55;
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
.ps-art-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  font-size: 12px;
  color: var(--dsw-alias-label-caption);
  min-width: 0;
}
.ps-art-meta > span {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  overflow: visible;
  text-overflow: unset;
  white-space: normal;
  word-break: break-word;
}

/* ---------- viewer ---------- */
.ps-viewer { border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); overflow: hidden; }
.ps-viewer-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 18px; border-bottom: 1px solid var(--dsw-alias-border-l2); }
.ps-viewer-body { padding: 20px 26px; max-height: 560px; overflow: auto; line-height: 1.7; font-size: 14.5px; }
.ps-viewer-body h1, .ps-viewer-body h2, .ps-viewer-body h3, .ps-viewer-body h4 { line-height: 1.3; margin: 1.2em 0 0.5em; font-weight: 600; }
.ps-viewer-body h1 { font-size: 22px; } .ps-viewer-body h2 { font-size: 19px; } .ps-viewer-body h3 { font-size: 16px; } .ps-viewer-body h4 { font-size: 14.5px; }
.ps-viewer-body p { margin: 0 0 0.9em; }
.ps-viewer-body ul, .ps-viewer-body ol { padding-left: 22px; margin: 0 0 0.9em; }
.ps-viewer-body hr { border: none; border-top: 1px solid var(--dsw-alias-border-l2); margin: 1.2em 0; }
.ps-viewer-body blockquote { margin: 0 0 0.9em; padding: 4px 16px; border-left: 3px solid var(--dsw-alias-border-l3); color: var(--dsw-alias-label-dimmed); }
.ps-viewer-body table { border-collapse: collapse; margin: 0 0 0.9em; }
.ps-viewer-body th, .ps-viewer-body td { border: 1px solid var(--dsw-alias-border-l2); padding: 6px 12px; font-size: 13.5px; }
.ps-viewer-body th { background: var(--dsw-alias-bg-layer-2); font-weight: 600; }

/* ---------- markdown (renderMarkdown → .ps-md, markdown-it output) ---------- */
.ps-md { font-size: 14.5px; line-height: 1.7; color: var(--dsw-alias-label-primary, #1f2329); }
.ps-md h1, .ps-md h2, .ps-md h3, .ps-md h4, .ps-md h5, .ps-md h6 { line-height: 1.3; margin: 1.2em 0 0.5em; font-weight: 600; }
.ps-md h1 { font-size: 21px; } .ps-md h2 { font-size: 18px; } .ps-md h3 { font-size: 15px; } .ps-md h4 { font-size: 14px; } .ps-md h5, .ps-md h6 { font-size: 13px; }
.ps-md p { margin: 0 0 0.9em; }
.ps-md ul, .ps-md ol { margin: 0 0 0.9em; padding-left: 22px; }
.ps-md li { margin: 3px 0; }
.ps-md a { color: var(--dsw-alias-state-business-primary, #4f7cff); }
.ps-md hr { border: none; border-top: 1px solid var(--dsw-alias-border-l2); margin: 1.2em 0; }
.ps-md blockquote { margin: 0 0 0.9em; padding: 4px 16px; border-left: 3px solid var(--dsw-alias-border-l3); color: var(--dsw-alias-label-dimmed); }
.ps-md img { max-width: 100%; }
.ps-md table { border-collapse: collapse; margin: 0 0 0.9em; }
.ps-md th, .ps-md td { border: 1px solid var(--dsw-alias-border-l2); padding: 6px 12px; font-size: 13.5px; text-align: left; }
.ps-md th { background: var(--dsw-alias-bg-layer-2); font-weight: 600; }
/* markdown-it-footnote 输出 */
.ps-md-footnotes-title { font-size: 12px; font-weight: 650; letter-spacing: 0.05em; text-transform: uppercase; color: var(--dsw-alias-label-caption, #999); margin-top: 22px; border-top: 1px solid var(--dsw-alias-border-l2); padding-top: 10px; }
.ps-md .footnotes { margin-top: 4px; }
.ps-md .footnotes-list { margin: 4px 0 0 22px; font-size: 13px; color: var(--dsw-alias-label-secondary, #666); }
.ps-md .footnote-item { margin: 4px 0; }
.ps-md .footnote-ref { font-size: 11px; font-weight: 600; color: var(--dsw-alias-state-business-primary, #4f7cff); margin: 0 1px; }
.ps-md .footnote-ref a { text-decoration: none; color: inherit; }
.ps-md .footnote-backref { text-decoration: none; color: var(--dsw-alias-label-caption, #999); font-size: 12px; margin-left: 4px; }

/* ---------- log panel ---------- */
.ps-log-panel { border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); overflow: hidden; }
.ps-log-head { display: flex; align-items: center; gap: 10px; padding: 12px 18px; cursor: pointer; user-select: none; font-size: 14px; font-weight: 550; }
.ps-log-head:hover { background: var(--dsw-alias-interactive-bg-hover); }
.ps-log-body { border-top: 1px solid var(--dsw-alias-border-l2); padding: 14px 18px; max-height: 260px; overflow: auto; background: var(--dsw-alias-bg-layer-2); font-size: 12.5px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; word-break: break-word; }

/* ---------- toolbar / notice ---------- */
.ps-toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
.ps-toolbar .spacer { flex: 1; }
.ps-notice { border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; font-size: 13.5px; }
.ps-notice.ok { background: var(--dsw-alias-state-success-tertiary, transparent); color: var(--dsw-alias-state-success-primary); border: 1px solid var(--dsw-alias-border-l2); }
.ps-notice.err { color: var(--dsw-alias-state-error-primary); border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-interactive-bg-hover-danger); }

/* ---------- detail two-column panel ---------- */
.ps-panel { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 20px; }
@media (max-width: 900px) { .ps-panel { grid-template-columns: 1fr; } }

/* ---------- run selector rows ---------- */
.ps-units-head { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
.ps-units-title { font-size: 15px; font-weight: 600; min-width: 0; }
.ps-units-summary { font-size: 12.5px; color: var(--dsw-alias-label-secondary); flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ps-units-caret { color: var(--dsw-alias-label-secondary); transition: transform 140ms ease; }
.ps-units-caret.open { transform: rotate(180deg); }
.ps-unit-row { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 8px; cursor: pointer; min-width: 0; overflow: hidden; transition: background-color 140ms ease; }
.ps-unit-row:hover { background-color: var(--dsw-alias-interactive-bg-hover); }
.ps-unit-row.on { background-color: var(--dsw-alias-interactive-bg-hover); }
.ps-unit-add { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; min-width: 0; }
.ps-unit-add .ps-input { flex: 1 1 8em; min-width: 0; }
.ps-unit-add .ps-unit-kind { flex: 0 1 6.5em; min-width: 0; }
.ps-unit-add .ps-btn { flex: none; }

/* ---------- rerun modal ---------- */
.ps-rerun { display: flex; flex-direction: column; gap: 14px; }
.ps-rerun-opt { border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; padding: 14px 16px; background: var(--dsw-alias-bg-layer-1); }
.ps-rerun-opt-title { font-size: 14.5px; font-weight: 600; color: var(--dsw-alias-label-primary); margin-bottom: 4px; }
.ps-rerun-opt-body { font-size: 13px; color: var(--dsw-alias-label-secondary); line-height: 1.55; margin-bottom: 12px; }
.ps-rerun-fresh { background: var(--dsw-alias-state-error-primary); border-color: transparent; color: var(--dsw-alias-label-primary-foreground); width: 100%; box-shadow: 0 1px 2px rgba(0,0,0,0.12); }
.ps-rerun-fresh:not(:disabled):hover { background: var(--dsw-alias-state-error-primary); filter: brightness(1.06); }
.ps-rerun-input { width: 100%; min-height: 76px; }
.ps-rerun-confirm { font-size: 14px; line-height: 1.6; padding: 12px 14px; border-radius: 8px; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); }
.ps-rerun-confirm.danger { border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-state-error-primary); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); }
.ps-rerun-instruction { font-size: 13px; color: var(--dsw-alias-label-secondary); background: var(--dsw-alias-bg-layer-2); border-radius: 8px; padding: 10px 12px; word-break: break-word; }
.ps-rerun-instruction-label { font-size: 12px; color: var(--dsw-alias-label-caption); margin-bottom: 4px; }
.ps-rerun-confirm-btn { background: var(--dsw-alias-state-error-primary) !important; border-color: transparent !important; color: var(--dsw-alias-label-primary-foreground) !important; }
.ps-rerun-confirm-btn:not(:disabled):hover { background: var(--dsw-alias-state-error-primary) !important; filter: brightness(1.06); }

/* ---------- create form extras ---------- */
.ps-req { color: var(--dsw-alias-state-error-primary); font-weight: 700; }
.ps-patterns { display: flex; flex-direction: column; gap: 8px; }
.ps-pattern { display: flex; align-items: flex-start; gap: 8px; padding: 9px 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; cursor: pointer; background: var(--dsw-alias-bg-layer-1); transition: border-color 140ms ease, background 140ms ease; }
.ps-pattern.on { border-color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, transparent); }
.ps-pattern input { accent-color: var(--dsw-alias-brand-primary); margin-top: 2px; flex: none; }
.ps-pattern-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ps-pattern-title { font-size: 13.5px; font-weight: 600; color: var(--dsw-alias-label-primary); }
.ps-pattern-desc { font-size: 12.5px; color: var(--dsw-alias-label-secondary); }
.ps-pattern.must { cursor: default; }
.ps-pattern.must .ps-pattern-title { color: var(--dsw-alias-label-secondary); }
.ps-pattern-nec { margin-left: auto; flex: none; font-size: 11px; padding: 1px 8px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-caption); }
.ps-pattern-nec.must { color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-border-l3); font-weight: 600; }
.ps-pattern-nec.recommended { color: var(--dsw-alias-label-secondary); }
.ps-patterns-open { display: flex; align-items: center; gap: 12px; }
.ps-patterns-summary { flex: 1; min-width: 0; font-size: 13px; color: var(--dsw-alias-label-secondary); }
.ps-patterns-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 52vh; overflow-y: auto; padding-right: 4px; }

/* ================= workbench ================= */
/* The workbench must STRETCH inside whatever flex/block container hosts it
   (shell panel or the session view area): as a flex item, default
   flex:0 1 auto sizes to content and clips the right half. */
.ps-workbench { display: flex; height: 100%; width: 100%; flex: 1 1 auto; min-width: 0; min-height: 0; overflow: hidden; }
/* The .ps-root * reset never applies here (the workbench mounts outside any
   .ps-root wrapper), so establish border-box for the whole subtree — without
   it, width:100% + padding overflows (negative auto margins) and clips.
   NOTE: this CSS lives in a JS template literal — a stray backtick anywhere
   inside would terminate it early and silently strip all later styles. */
.ps-workbench, .ps-workbench *, .ps-workbench *::before, .ps-workbench *::after { box-sizing: border-box; }
[data-conversation-scroll]:has(.ps-workbench) > [data-composer-seat] { display: none !important; }
[data-conversation-scroll] > [data-slot="conversation.session"] > div:has(.ps-workbench) { flex: 1 1 0 !important; }

/* --- left navigation --- */
.ps-nav { flex: 0 0 264px; min-width: 0; border-right: 1px solid var(--dsw-alias-border-l2); display: flex; flex-direction: column; background: var(--dsw-alias-bg-base); }
.ps-nav-head { padding: 18px 16px 12px; border-bottom: 1px solid var(--dsw-alias-border-l2); }
.ps-nav-title { display: flex; align-items: center; gap: 10px; }
.ps-nav-title .name { font-size: 15px; font-weight: 650; letter-spacing: -0.01em; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ps-nav-title .ps-btn { flex: none; }
.ps-nav-head .ps-sub { margin: 4px 0 0; font-size: 12.5px; color: var(--dsw-alias-label-caption); }
.ps-nav-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 8px; }

.ps-nav-row { position: relative; display: block; width: 100%; text-align: left; padding: 8px 10px 8px 14px; border-radius: 8px; cursor: pointer; transition: background 140ms ease; border: none; background: transparent; margin-bottom: 2px; }
.ps-nav-row:hover { background: var(--dsw-alias-interactive-bg-hover); }
.ps-nav-row.on { background: var(--dsw-alias-bg-layer-2); }
.ps-nav-row.on::before { content: ''; position: absolute; left: 4px; top: 9px; bottom: 9px; width: 3px; border-radius: 3px; background: var(--dsw-alias-state-business-primary); }
.ps-nav-top { display: flex; align-items: center; gap: 8px; min-width: 0; }
.ps-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex: none; }
.ps-dot.running { color: var(--dsw-alias-brand-primary); }
.ps-dot.generating { color: var(--dsw-alias-state-warn-primary); }
.ps-dot.failed { color: var(--dsw-alias-state-error-primary); }
.ps-dot.completed { color: var(--dsw-alias-state-success-primary); }
.ps-dot.idle { color: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-caption)); }
.ps-nav-name { font-size: 14px; font-weight: 550; color: var(--dsw-alias-label-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
.ps-nav-del { margin-left: auto; opacity: 0; padding: 2px 8px; font-size: 12px; }
.ps-nav-row:hover .ps-nav-del { opacity: 1; }
.ps-nav-meta { margin: 3px 0 0 15px; font-size: 12px; color: var(--dsw-alias-label-caption); display: flex; gap: 10px; flex-wrap: wrap; }
.ps-nav-empty { padding: 24px 12px; text-align: center; color: var(--dsw-alias-label-caption); font-size: 13px; }

/* --- main panes --- */
.ps-main { flex: 1; min-width: 0; overflow-y: auto; }
.ps-main-inner { max-width: 880px; width: 100%; margin: 0 auto; padding: 20px 28px 56px; }

/* right-pane empty states */
.ps-empty-hero { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 12px; padding: 48px 28px; }
.ps-hero-glyph { font-size: 44px; line-height: 1; opacity: 0.5; }
.ps-empty-hero h2 { font-size: 20px; font-weight: 650; letter-spacing: -0.01em; margin: 4px 0 0; }
.ps-empty-hero p { color: var(--dsw-alias-label-dimmed); font-size: 14.5px; line-height: 1.65; max-width: 440px; margin: 0; }
.ps-empty-hero .ps-caption { margin-top: 4px; }
.ps-empty-hero.quiet { opacity: 0.8; }
.ps-meme { width: 200px; height: 200px; object-fit: contain; margin-bottom: 2px; user-select: none; pointer-events: none; -webkit-mask-image: radial-gradient(ellipse closest-side, #000 52%, transparent 76%); mask-image: radial-gradient(ellipse closest-side, #000 52%, transparent 76%); }

/* --- detail info bar --- */
.ps-info-bar { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; border-bottom: 1px solid var(--dsw-alias-border-l2); padding-bottom: 16px; margin-bottom: 20px; }
.ps-info-bar > div:first-child { min-width: 0; flex: 1 1 auto; }
.ps-info-bar h2 { font-size: 20px; font-weight: 650; letter-spacing: -0.01em; margin: 0; }
.ps-info-caption { font-size: 12.5px; color: var(--dsw-alias-label-caption); margin-top: 3px; }
.ps-info-bar .spacer { flex: 1; }

@media (max-width: 820px) {
  .ps-workbench { flex-direction: column; overflow: auto; }
  .ps-nav { flex: none; width: 100%; border-right: none; border-bottom: 1px solid var(--dsw-alias-border-l2); max-height: 38vh; }
  .ps-main { overflow: visible; }
  .ps-work-middle.ps-grid-row { flex-direction: column; }
  .ps-work-middle.ps-grid-row > .ps-grid-cell { flex: none !important; min-height: 120px; max-height: 32vh; }
  .ps-work-middle.ps-grid-row .ps-grid-split { display: none; }
}

/* ================= boot + work layouts (phase 1) ================= */
.ps-layout-boot, .ps-layout-work { display: flex; flex-direction: column; height: 100%; width: 100%; min-height: 0; min-width: 0; overflow: hidden; }
.ps-title-bar { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-base); flex: none; }
.ps-title-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
.ps-title-mas { min-width: 0; }
.ps-title-name { font-size: 15px; font-weight: 650; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ps-title-caption { font-size: 12px; color: var(--dsw-alias-label-caption); display: block; }
.ps-boot-sign { display: inline-flex; align-items: center; gap: 8px; }
.ps-boot-glyph { font-size: 18px; opacity: 0.85; }
.ps-boot-name { font-size: 15px; font-weight: 650; letter-spacing: -0.01em; }
.ps-boot-body { flex: 1; min-height: 0; overflow: hidden; padding: 16px 20px 24px; display: flex; flex-direction: column; }
.ps-boot-body > .ps-scroll-frame { flex: 1; min-height: 0; }
.ps-boot-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); min-width: 0; margin: 12px; }
.ps-boot-card.on { border-color: var(--dsw-alias-brand-primary); box-shadow: inset 0 0 0 1px var(--dsw-alias-brand-primary); }

/* work shell: middle + optional status bar */
.ps-work-shell { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
.ps-work-shell-middle { flex: 1; min-height: 0; overflow: hidden; }
.ps-work-middle { height: 100%; width: 100%; min-height: 0; }
.ps-work-side, .ps-work-stage { min-height: 0; overflow: hidden; background: var(--dsw-alias-bg-base); }
.ps-work-status { flex: none; border-top: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); }
.ps-work-status-inner { padding: 0; }

/* grid-view */
.ps-grid { display: flex; width: 100%; height: 100%; min-height: 0; min-width: 0; overflow: hidden; gap: 0; }
.ps-grid-row { flex-direction: row; }
.ps-grid-column { flex-direction: column; }
.ps-grid-cell { min-height: 0; min-width: 0; overflow: hidden; display: flex; flex-direction: column; }
.ps-grid-cell > .ps-part { flex: 1 1 0; min-height: 0; min-width: 0; height: 100%; width: 100%; }
.ps-grid-split { flex: none; background: var(--dsw-alias-border-l2); touch-action: none; user-select: none; z-index: 2; }
.ps-grid-split-h { width: 1px; cursor: col-resize; margin: 0; }
.ps-grid-split-v { height: 1px; cursor: row-resize; margin: 0; }
.ps-grid-split:hover, .ps-grid-split:active { background: var(--dsw-alias-brand-primary); opacity: 0.55; }

/* part frame — fixed title band + scroll body */
.ps-region-stack { display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden; }
.ps-region-single { height: 100%; min-height: 0; }
.ps-region-single > .ps-part { flex: 1 1 0; min-height: 0; }
.ps-part { display: flex; flex-direction: column; flex: 1; min-height: 0; min-width: 0; overflow: hidden; border-bottom: 1px solid var(--dsw-alias-border-l2); position: relative; z-index: var(--ps-z-part, 1); }
.ps-part:last-child { border-bottom: none; }
.ps-part-frameless { border-bottom: none; }
.ps-part-title {
  flex: none; height: 36px; min-height: 36px;
  display: flex; align-items: center; gap: 8px;
  padding: 0 8px 0 12px;
  font-size: 13px; font-weight: 600;
  border-bottom: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-1);
  position: relative; z-index: 1;
}
.ps-part-title:has(.ps-part-desc:hover),
.ps-part-title:has(.ps-part-desc:focus-within) { z-index: var(--ps-z-part-active, 3); }
.ps-part-title-text { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 36px; }
.ps-part-title-actions { flex: none; display: inline-flex; align-items: center; gap: 4px; margin-left: auto; min-width: 0; overflow: hidden; }
.ps-part-title-btn { padding: 2px 4px !important; line-height: 0; min-width: 28px; }
.ps-part-title-btn .ps-icon { pointer-events: none; }

/* ---------- temporary window (popover tools) ---------- */
.ps-temp-win {
  min-width: 200px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-1);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.16);
}
.ps-temp-win-body { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.ps-temp-win-label { font-size: 12.5px; font-weight: 600; color: var(--dsw-alias-label-primary); }
.ps-temp-win-range { width: 100%; accent-color: var(--dsw-alias-brand-primary); }
.ps-temp-win-pct { font-size: 12px; color: var(--dsw-alias-label-caption); text-align: right; }
.ps-part-body { flex: 1; min-height: 0; min-width: 0; overflow: hidden; display: flex; flex-direction: column; }
.ps-part-body > .ps-scroll-frame { flex: 1; min-height: 0; min-width: 0; }

.ps-menu {
  position: fixed; min-width: 168px; max-width: 280px;
  padding: 4px; border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-1);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
}
.ps-menu-item {
  display: block; width: 100%; text-align: left;
  border: none; background: transparent; cursor: pointer;
  padding: 7px 10px; border-radius: 6px;
  font-size: 13px; color: var(--dsw-alias-label-primary);
}
.ps-menu-item:hover:not(.disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.ps-menu-item.danger { color: var(--dsw-alias-state-error-primary); }
.ps-menu-item.disabled { opacity: 0.45; cursor: not-allowed; }
.ps-tree-rename { width: 100%; min-width: 0; padding: 4px 8px; font-size: 13px; }

.ps-work-center-inner { max-width: 960px; padding: 12px 14px; min-width: 0; }
.ps-work-center-empty { padding: 12px 14px; }
.ps-tree-group { margin-bottom: 10px; min-width: 0; }
.ps-tree-group-title { font-size: 11px; font-weight: 650; letter-spacing: 0.04em; text-transform: uppercase; color: var(--dsw-alias-label-caption); padding: 4px 4px 6px; }
.ps-tree-unit { margin-bottom: 2px; min-width: 0; }
.ps-tree-unit-row { font-weight: 600; font-size: 13px; cursor: context-menu; }
.ps-tree-unit-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ps-tree-unit-row .ps-tree-unit-add {
  flex: none;
  padding: 2px 4px !important;
  line-height: 0;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 140ms ease;
}
.ps-tree-unit-row:hover .ps-tree-unit-add,
.ps-tree-unit-row:focus-within .ps-tree-unit-add {
  opacity: 1;
  pointer-events: auto;
}
.ps-tree-unit-add .ps-icon { pointer-events: none; }
.ps-tree-tasks { padding: 2px 0 4px 12px; min-width: 0; border-left: 1px solid var(--dsw-alias-border-l2); margin-left: 10px; }
.ps-tree-task-row { font-weight: 550; font-size: 13px; }
.ps-tree-task-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ps-tree-empty { padding: 6px 8px 8px; font-size: 12px; }
.ps-work-left-inner, .ps-work-right-inner { padding: 8px 10px; min-width: 0; overflow-x: hidden; box-sizing: border-box; }
.ps-work-left-scroll { max-height: none; overflow: auto; }
.ps-gen-bar { border-bottom: none; background: transparent; padding: 8px 16px; }
.ps-gen-bar-inner { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.ps-gen-bar-text { font-weight: 550; }
.ps-gen-progress { width: min(520px, 100%); }
.ps-gen-progress-head { display: flex; align-items: center; gap: 10px; }
.ps-gen-progress-line {
  margin-top: 12px; padding: 10px 12px; border-radius: 10px;
  border: 1px solid var(--dsw-alias-line-divider-default);
  background: var(--dsw-alias-fill-secondary, rgba(0, 0, 0, 0.03));
  font-size: 13px; line-height: 1.45; color: var(--dsw-alias-label-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
`