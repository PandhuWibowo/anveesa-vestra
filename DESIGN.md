# Vestra Design System

Vestra is a personal desktop app for browsing cloud storage. It should feel like
a native file manager (Finder, Files, Google Drive): quiet, fast, and obvious.
The files are the content; the interface steps back.

This document is the source of truth for every page, menu, dialog and panel.
Tokens live in `web/src/styles.css` under `:root`. If code and this file
disagree, fix one of them.

---

## 1. Principles

1. **Content first.** Chrome is light, flat and low-contrast. File names,
   folders and previews carry the visual weight.
2. **One way to do a thing.** Every action has one primary place (a button or
   a menu item). Right-click mirrors the ⋯ menu; it never adds actions.
3. **Show on intent.** Row actions, checkboxes and resize handles appear on
   hover or focus, and stay visible while in use.
4. **Plain words.** Labels describe what happens to the user's files, not the
   API underneath ("Copy to another storage", not "Transfer object").
5. **Calm motion.** Motion explains a change of place (a panel slides in, a menu
   grows from its button). Nothing animates for decoration.

---

## 2. Color

One accent (sky blue) on neutral surfaces. Provider brand colors appear only
inside provider badges.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--canvas` | `#eef4fa` | `#070d18` | Window background, sidebar |
| `--bg` | `#ffffff` | `#0d1626` | Content panel |
| `--surface` | `#ffffff` | `#111c2f` | Menus, dialogs, cards |
| `--surface-2` | `#f4f8fc` | `#16233a` | Inputs, subtle fills |
| `--hover` | navy 5.5% | sky-white 6% | Hover fill on rows and items |
| `--border` | `#e6edf4` | sky 9% | Dividers, card outlines |
| `--border-2` | `#d3dfea` | sky 16% | Input outlines, ghost buttons |
| `--text` | `#0d1b2a` | `#e6eef8` | Primary text |
| `--text-2` | `#4b5d71` | `#a3b4c9` | Secondary text |
| `--muted` | `#8796a8` | `#6c7f98` | Hints, meta, idle icons |
| `--accent` | `#0284c7` | `#38bdf8` | Primary buttons, active states, links |
| `--accent-bg` | sky 10% | sky 12% | Selected rows, active nav |
| `--danger` | `#e11d48` | `#fb7185` | Destructive actions only |
| `--success` | `#16a34a` | `#4ade80` | Confirmations only |
| `--folder` | `#38bdf8` | `#38bdf8` | Folder glyphs |

Rules:
- Text on `--accent` fills is white (light) or `#04233a` (dark).
- `--danger` is never a fill on a resting button; it appears as text, or as a
  fill only inside a confirm dialog's destructive button.
- The brand gradient (`--brand-grad`) is reserved for the **logo mark only**.
  No gradient buttons, gradient text or gradient backgrounds.

---

## 3. Typography

System font stack (`--font`): SF Pro on macOS, Segoe UI Variable on Windows.
Monospace (`--mono`) is only for values the user may copy: paths, ETags,
hashes, JSON, CLI commands. Never for titles or labels.

| Role | Size / weight | Example |
|---|---|---|
| Page title | 20px / 700, tracking −0.4px | "Home", "Settings" |
| Dialog / panel title | 15px / 650 | "Rename or move" |
| Body | 13px / 400–500 | File names, menu items |
| Label | 12.5px / 600, sentence case | "Content type" |
| Meta | 12px / 400, `--muted` | "1.0 MB · image/jpeg" |
| Section heading | 11–13px / 600, `--muted` | "Storage", "Favorites" |

Rules:
- **Sentence case everywhere.** No ALL-CAPS labels, no letter-spaced kickers.
- Numbers in tables use `font-variant-numeric: tabular-nums`.
- Truncate long names with an ellipsis and show the full name in a tooltip.

---

## 4. Space, shape, depth

- Spacing scale: 4, 6, 8, 12, 16, 20, 24, 32 px.
- Radii: `--r-xs` 5 (chips), `--r-sm` 7 (rows, small buttons), `--r` 9
  (buttons, inputs), `--r-lg` 14 (cards, menus, dialogs, panels).
- Control heights: 32px buttons and inputs, 40px table rows, 32px sidebar rows,
  34px menu items.
- Depth: three levels only.
  - `--shadow-panel`: hairline + 1px blur, for the content panel and active items.
  - `--shadow-sm`: hover lift on cards.
  - `--shadow-md`: floating layers (menus, dialogs, toasts).
- No glass/blur effects, no inner glows, no colored shadows except the logo.

---

## 5. Layout

```
┌──────────────┬──────────────────────────────────────────────┐
│ ● ● ●  ▯ Logo│  Header: location / title          actions   │
│              │──────────────────────────────────────────────│
│ Home         │                                              │
│              │  Content                                     │
│ Storage    + │                                 ┌──────────┐ │
│  · bucket    │                                 │ Side     │ │
│ Favorites    │                                 │ panel    │ │
│              │                                 └──────────┘ │
│ ⚙ Settings ☾ │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

- **Window chrome:** the traffic lights, sidebar toggle, logo and page title share
  one horizontal line (`--chrome-mid`, 40px from the top).
- **Sidebar:** 244px default, 200–360px when resized. It slides fully away
  (⌘\ / Ctrl+\); the toggle never moves in a normal window.
- **Content panel:** floats on the canvas with an 8px gap and 12px radius.
- **Page header:** 64px tall. Title left; the primary action is the last
  item on the right.
- **Side panels** (preview, details, versions): 420px wide, attached to the
  right edge of the content panel, with header, scrolling body and an optional
  sticky footer.

---

## 6. Components

### Buttons
| Variant | Look | Use |
|---|---|---|
| Primary | Solid `--accent`, white text | One per view: the main action |
| Ghost | `--bg` fill, `--border-2` outline | Secondary actions |
| Danger | Red text, no fill; red fill only in confirm dialogs | Delete |
| Icon | 30–32px square, no border, `--muted` icon | Toolbars, rows |

Labels are verbs: "Save", "Create folder", "Copy". Never "OK" or "Submit".

### Menus
- Open from a ⋯ button (anchored, right-aligned) or right-click (at the pointer).
- 14px radius, 5px padding, 34px items, a 15px icon plus a label.
- Group with separators: **open → change → copy → info → destructive**.
- The destructive item is last, in red, after a separator.
- Close on outside click, Esc, scroll, blur or resize.

### Lists and tables
- 40px rows; hover fill `--hover`; selected fill `--accent-bg`.
- Checkboxes and row actions appear on hover, and stay while selected or while
  that row's menu is open.
- Row actions: at most **two** visible buttons (one quick action + ⋯).

### Dialogs
- 440px default width, 14px radius, `--shadow-md`, dimmed backdrop.
- Header: title in sentence case, plus a one-line description of what will happen.
- Footer: right-aligned; Cancel (ghost) then the primary action.
- Enter submits; Esc cancels; focus starts in the first field.

### Side panels
- Header: file name (sans, ellipsis) with a meta line under it
  (size · type · date), and icon actions on the right with close last.
- Field labels sentence case; read-only values in monospace with a copy action.

### Inputs
- 36px high, `--surface-2` fill, transparent border; focus shows `--accent`
  border plus a 3px `--accent-ring`.
- Every field has a visible label. Placeholders show an example
  ("e.g. backups/"), never instructions.

### Empty states
- One glyph (muted, 28px), one sentence of what's missing, and one action.

### Toasts
- Bottom-right, 8s max, one line. Success uses a check icon; errors stay until
  dismissed.

---

## 7. Motion

| Token | Value | Use |
|---|---|---|
| `--dur` | 140ms | Hover, color, opacity |
| `--slide` | 280ms `cubic-bezier(.32,.72,0,1)` | Sidebar, panels |
| Menus | 120ms fade + 4px rise | Dropdowns, context menus |
| Dialogs | 160ms fade + 0.98 → 1 scale | |

- Only `transform` and `opacity` animate (no width or layout animation except
  the sidebar).
- Respect `prefers-reduced-motion`: drop the transforms and keep the fades.

---

## 8. Writing

- Address the user as "you"; describe outcomes.
- Use storage words people know: storage, bucket, folder, file, link.
- Avoid: "connection ID", "prefix", "object", "presigned", "endpoint" in UI
  copy (allowed in advanced fields, with a hint).
- Errors say what happened and what to do: "Couldn't list buckets. This
  account needs a project ID."
- No exclamation marks, no emoji, no "Oops".

---

## 9. Anti-patterns (reject in review)

- Gradient buttons, gradient text, gradient page backgrounds.
- ALL-CAPS or letter-spaced labels.
- Monospace titles.
- More than two visible actions per row.
- Icons without a label or tooltip.
- Cards inside cards; borders and shadows on the same element at rest.
- Decorative glows, blobs, glassmorphism.
- Placeholder text used as a label.
- "Seamless", "powerful", "blazing fast" or similar filler in UI copy.
