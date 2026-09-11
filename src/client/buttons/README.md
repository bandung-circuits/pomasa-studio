UI + data model

Maintain unified button styles via `PsButton` / `registerButton` in `button.js`.
All reusable button UIs should register here; call sites pass `id` and override props (title, onClick, className layout hooks only).

## API

- `PsButton({ id, ...props })` — core renderer
- `psBtn(props, children)` — text button shorthand (`primary` → dark tone)
- `psIconBtn(props)` — icon button shorthand (`tone` default light)
- `registerButton(id, spec)` — preset: `kind`, `tone`, `ghost`, `icon`, `size`, `title`

## Class names (generated, do not hand-code on `<button>`)

| Variant | Classes |
|---|---|
| text light | `ps-ui-btn ps-btn ps-ui-btn--text ps-ui-btn--light` |
| text light ghost | `… ps-ui-btn--light ghost` |
| text dark | `… ps-ui-btn--text ps-ui-btn--dark primary` |
| icon light | `ps-ui-btn ps-btn ps-ui-btn--icon ps-icon-btn ps-ui-btn--light` |
| icon light ghost | `… ps-ui-btn--light ghost` |
| icon dark | `… ps-ui-btn--icon ps-icon-btn ps-ui-btn--dark` |

Layout-only hooks: `ps-part-title-btn`, `ps-tree-unit-add` (padding/size in parent context).

## Visual spec

text UI:
- dark: black background, white text
- light: gray background, dark text

icon UI:
- dark: circle black, white icon
- light: transparent bg, dark icon; ghost hover uses gray fill
