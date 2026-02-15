# TypeArt

Keyboard-first e-commerce store with built-in live keymap editor and matrix tester. Connect a VIA-enabled QMK keyboard over WebHID, visualize the layout, reassign keys from a searchable picker, and flash changes instantly — all in the browser.

## Quick Start

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # Node server → build/
node build      # run production server
pnpm preview    # preview production build
pnpm check      # type-check
```

Requires **Node.js 22+** and **pnpm**. WebHID only works in **Chrome/Edge**. On Linux, install udev rules: `sudo cp static/99-typeart.rules /etc/udev/rules.d/ && sudo udevadm control --reload-rules`.

## Pages

| Route | Purpose |
|---|---|
| `/` | Landing — rainbow-lettered logo, WebHID check, nav cards (Store full-width, Configure + Matrix Test below) |
| `/store` | Product grid — keyboard kits with detail pages, variant selection, cart with localStorage |
| `/configure` | Live keymap editor — connect keyboard, auto-detect definition, click-to-reassign keys, always-visible keycode picker with search/categories/LT-MT builder/"Any" key input |
| `/test` | Matrix tester — polls switch state at ~60Hz, highlights pressed keys in real time |
| `/type` | Typing speed test — time/words/quote modes, score submission, leaderboard on finish |
| `/orders` | Order history — list of placed orders with status, links to detail |
| `/orders/[id]` | Order detail — itemized breakdown with color, variants, totals |
| `/login` | Login/register — tabbed form, session-based auth |

## Architecture

```
UI Components (Svelte 5)
    ↓ reads/writes
Stores (Svelte 5 runes — $state, $derived, $effect)
    ↓ calls
Protocol (VIA command encoder/decoder)
    ↓ queued 32-byte HID reports
Transport (WebHID, serialized command queue)
    ↓ USB HID
QMK Keyboard firmware
```

### Transport — `src/lib/transport/hid-transport.ts`

`HIDTransport` class. Single HID device connection with serialized command queue.

- Filters: `usagePage: 0xFF60, usage: 0x61` (VIA raw HID)
- Reports: **32 bytes**, report ID `0x00`
- `sendCommand(data)` → queued, one-at-a-time. Returns `Promise<Uint8Array>` (response or 1s timeout)
- `sendRaw(data)` → fire-and-forget (no queue)
- Command queue prevents overlapping HID requests that cause protocol corruption
- `requestDevice()` opens browser picker; `connect()` with no args tries auto-reconnect

### Protocol — `src/lib/protocol/`

`ViaProtocol` class wrapping `HIDTransport`:

| Method | VIA Command | Notes |
|---|---|---|
| `getProtocolVersion()` | `0x01` | 16-bit version |
| `getLayerCount()` | `0x11` | 8-bit count |
| `getFullKeymap(layers, rows, cols)` | `0x12` bulk | 28 bytes/request via `DynamicKeymapGetBuffer` |
| `setKeycode(layer, row, col, kc)` | `0x05` | Single 16-bit keycode write |
| `getKeycode(layer, row, col)` | `0x04` | Single read |
| `getLayoutOptions()` / `setLayoutOptions()` | `0x02` | 32-bit bitmask |
| `getSwitchMatrixState()` | `0x03` | Bitfield, big-endian byte order (MSB first per QMK) |
| `getEncoderKeycode(layer, id, dir)` | `0x14` | 16-bit keycode; dir 0=CCW, 1=CW |
| `setEncoderKeycode(layer, id, dir, kc)` | `0x15` | Requires `encoder_map: true` in QMK firmware |

**Byte encoding**: keycodes are 16-bit big-endian. Parameterized:
- `LT(layer, kc)` = `0x4000 | (layer << 8) | kc`
- `MO(layer)` = `0x5220 | layer`, `TG` = `0x5260`, `TO` = `0x5200`, `TT` = `0x52C0`, `OSL` = `0x5280`, `DF` = `0x5240`
- `MT(mod, kc)` = `0x2000 | (mod << 8) | kc`
- Mod bits: `0x01` Ctrl, `0x02` Shift, `0x04` Alt, `0x08` GUI; add `0x10` for right-side

### Keyboard Definitions — `src/lib/keyboard/`

- **`types.ts`** — `KeyboardDefinition` (VIA v3 JSON), `ParsedKey` (position/size/rotation/matrix-coords/encoder), `EncoderDefinition`
- **`kle-parser.ts`** — `parseKLELayout(rows)` converts KLE JSON → `ParsedKey[]`; `filterKeysByLayoutOptions()` filters by layout choices
- **`definition.ts`** — fetch registry, load definitions, match by VID/PID (strips `0x` prefix, case-insensitive hex compare)

### Keycodes — `src/lib/keycodes/`

- **`ranges.ts`** — QMK range constants including `QK_GRAVE_ESCAPE` (0x5C16), Space Cadet (0x5C56–0x5C5B)
- **`catalog.ts`** — **~216 keycodes** across **6 categories**: Basic (letters/numbers/punctuation/modifiers/nav/F-keys/numpad), Media (corrected VIA consumer range 0xA5–0xBE), Macro (M0–M15), Layers (MO/TG/TO/TT/OSL/DF for 0–15), Special (Grave Escape, Space Cadet, shifted symbols, F13–F24, mouse keys, quantum), Lighting (backlight + RGB)
- **`labels.ts`** — `getKeycodeLabel(keycode)` handles catalog lookup → parameterized ranges (LT/MT/MO/TG/LM/etc) → hex fallback
- **`parser.ts`** — QMK string parser for "Any" key input. Supports hex literals, named keycodes with aliases (KC_SPC→KC_SPACE etc.), LT(), MT(), MO(), TG(), TO(), TT(), OSL(), DF(), OSM()

### Stores — `src/lib/stores/`

All Svelte 5 rune-based singletons:

- **`deviceStore`** — `transport`, `protocol`, `connectionState`. Manual state control (no race between callback and field assignment)
- **`keymapStore`** — 3D `keymap[layer][row][col]`, `encoderKeymap[layer][id][dir]`, `activeLayer`, `selectedKey`. Optimistic local update + device write. Encoder-aware routing via `getKeycodeForKey()`/`setKeycodeForSelected()`
- **`definitionStore`** — `definition`, `activeKeys` (filtered by layout options + encoder virtual keys), `rows`/`cols`, `encoderCount`. Auto-detect by VID/PID
- **`cartStore`** — shopping cart with localStorage persist (`'typeart-cart'`)
- **`themeStore`** — theme switcher (retro-beige / miami-nights / godspeed), localStorage persist (`'typeart-theme'`), applies `data-theme` attribute on `<html>`

### Components — `src/components/`

| Component | Key details |
|---|---|
| `Key.svelte` | Absolute-positioned key button. Label from `getKeycodeLabel()`. States: hover (blue), selected (yellow glow), pressed (cyan). Encoder keys rendered circular with violet border + direction indicator (↺/↻) |
| `KeyboardLayout.svelte` | Renders `ParsedKey[]`. Computes bounding box with minX/minY offset for centering. Inner div with CSS translate |
| `KeycodePicker.svelte` | Always visible when keymap loaded. 6 category tabs + search + keycode grid + LT/MT builder toggle + "Any" key input. No close button |
| `AnyKeyInput.svelte` | Text input for QMK keycode strings with live preview. Uses `parseKeycodeString()` |
| `CompoundKeycodeBuilder.svelte` | Visual LT/MT builder — mode toggle, layer/modifier dropdown, basic keycode dropdown, preview |
| `LayerSelector.svelte` | Layer tab bar |
| `ConnectionStatus.svelte` | Connect/disconnect + status dot + device info |
| `ImportExport.svelte` | Export/import keymap JSON |
| `ProductCard.svelte` | Store product card |
| `CartBadge.svelte` | Cart count pill |

## Themes

Three switchable colorways, toggled via the navbar **Theme** button. Choice persists in `localStorage`. Defined as CSS custom property overrides in `src/app.css`, managed by `src/lib/stores/theme.svelte.ts`.

| Theme | Style | Background | Accents |
|---|---|---|---|
| **Retro Beige** (default) | Vintage Macintosh Platinum era | Warm beige `#E8DCC6` | Apple rainbow |
| **Miami Nights** | Dark synthwave | Deep indigo `#0f0e17` | Neon cyan `#0AD2D3` + hot pink `#FF2E97` |
| **Godspeed** | NASA Apollo mission control | Warm cream `#e3d5b9` | NASA gold `#ffdb58` + powder blue `#5991ae` |

Logo colors, card hover gradients, and all UI tokens adapt per theme.

## Design System

**Vintage Macintosh beige** with **Apple rainbow accents** — defined in `src/app.css`:

| Token | Value | Use |
|---|---|---|
| `--base03` | `#E8DCC6` | Page background |
| `--base02` | `#F2EAD8` | Card/panel/key background |
| `--base01` | `#C4B396` | Borders, muted text |
| `--base00` | `#8A7A5F` | Secondary text |
| `--base0` | `#4D3F2A` | Body text |
| `--base1` | `#2A1E0E` | Headings |
| `--yellow` | `#FDB827` | Selected state |
| `--orange` | `#F5821F` | Warnings |
| `--red` | `#E03A3E` | Errors |
| `--blue` | `#009DDC` | Links, hover |
| `--cyan` | `#1BA8A0` | Connected, pressed keys |
| `--green` | `#61BB46` | Confirm |
| `--violet` | `#963D97` | Available |
| `--magenta` | `#D44D9E` | Available |

**Logo**: "TypeArt" in Courier Prime (italic, weight 560), each letter a muted rainbow color: T(#c4443a) y(#c86a2a) p(#b8941e) e(#4a8c3f) A(#2e7bab) r(#5b4a9e) t(#8b3a8b). Home page cards get a rainbow gradient border on hover via `background: linear-gradient(...) border-box` with rounded corners.

**Font loading**: Courier Prime loaded from Google Fonts in `app.html` (ital + wght variants).

## File Map

```
src/
├── app.css                          # Design tokens (vintage Macintosh beige), global reset
├── app.html                         # HTML shell + Google Fonts (Courier Prime)
├── app.d.ts                         # SvelteKit type declarations
├── lib/
│   ├── transport/
│   │   └── hid-transport.ts         # HIDTransport (WebHID, serialized command queue)
│   ├── protocol/
│   │   ├── commands.ts              # ViaCommand and KeyboardValue enums
│   │   ├── constants.ts             # REPORT_SIZE, BUFFER_CHUNK_SIZE, KEYCODE_SIZE
│   │   └── via-protocol.ts          # ViaProtocol class
│   ├── keyboard/
│   │   ├── types.ts                 # KeyboardDefinition, ParsedKey, KLE types
│   │   ├── kle-parser.ts            # parseKLELayout, filterKeysByLayoutOptions
│   │   └── definition.ts            # fetch/find definitions, VID/PID matching
│   ├── keycodes/
│   │   ├── ranges.ts                # QMK keycode range constants
│   │   ├── catalog.ts               # ~216 keycodes in 6 categories
│   │   ├── labels.ts                # getKeycodeLabel (handles all parameterized keycodes)
│   │   └── parser.ts                # QMK string parser (LT/MT/MO/TG/OSM/hex/named)
│   ├── store/
│   │   ├── types.ts                 # Product, CartItem types
│   │   └── parser.ts                # products.txt line-based parser
│   ├── stores/
│   │   ├── device.svelte.ts         # deviceStore — connection lifecycle
│   │   ├── keymap.svelte.ts         # keymapStore — 3D keymap, selection, writes
│   │   ├── definition.svelte.ts     # definitionStore — parsed keys, layout options
│   │   ├── cart.svelte.ts           # cartStore — localStorage-persisted cart
│   │   ├── theme.svelte.ts         # themeStore — theme switcher with localStorage
│   │   └── auth.svelte.ts          # authStore — user state, login/register/logout
│   ├── server/
│   │   ├── db.ts                    # SQLite (better-sqlite3, WAL mode, schema init)
│   │   ├── auth.ts                  # register, login, sessions (Argon2id)
│   │   ├── rate-limit.ts            # In-memory sliding window rate limiter
│   │   ├── scores.ts               # Score validation, submission, leaderboard queries
│   │   └── orders.ts               # Order creation (transactional), queries by user
│   └── utils/
│       ├── bytes.ts                 # readUint16BE, writeUint16BE, toHex
│       └── export.ts                # exportKeymap, parseImportedKeymap, downloadJson
├── components/
│   ├── Key.svelte                   # Single key (absolute position, label, states)
│   ├── KeyboardLayout.svelte        # Renders keys with offset centering
│   ├── KeycodePicker.svelte         # Category tabs + search + grid (always visible)
│   ├── AnyKeyInput.svelte           # QMK string input with live preview
│   ├── CompoundKeycodeBuilder.svelte # Visual LT/MT keycode builder
│   ├── LayerSelector.svelte         # Layer tab bar
│   ├── ConnectionStatus.svelte      # Connect/disconnect + status
│   ├── ImportExport.svelte          # Export/import keymap JSON
│   ├── ProductCard.svelte           # Product card for store listing
│   ├── VariantSelector.svelte       # Labeled <select> dropdown
│   ├── CartBadge.svelte             # Cart item count badge
│   └── Leaderboard.svelte          # Ranked score table (WPM, accuracy)
├── hooks.server.ts                  # Session parsing, cleanup intervals
└── routes/
    ├── +layout.svelte               # Nav bar (rainbow logo, account dropdown) + main slot
    ├── +layout.server.ts            # Pass user to all pages
    ├── +page.svelte                 # Home (Store hero + Configure/Test cards)
    ├── configure/+page.svelte       # Keymap editor
    ├── test/+page.svelte            # Matrix tester
    ├── type/+page.svelte            # Typing speed test + score submission + leaderboard
    ├── login/+page.svelte           # Login/register tabbed form
    ├── orders/
    │   ├── +page.svelte             # Order history list
    │   └── [id]/+page.svelte        # Order detail with itemized breakdown
    ├── api/
    │   ├── auth/{register,login,logout,me}/+server.ts  # Auth API routes
    │   ├── scores/{+server.ts,me/+server.ts}           # Score API routes
    │   └── orders/{+server.ts,[id]/+server.ts}         # Order API routes
    └── store/
        ├── +page.ts                 # Load: fetch & parse products.txt
        ├── +page.svelte             # Product listing grid
        ├── [slug]/+page.ts + .svelte # Product detail + variants
        └── cart/+page.svelte        # Cart with qty controls + totals

scripts/
└── backup-db.sh                     # Daily SQLite backup (WAL-safe, 7-day retention)

static/
├── products.txt                     # Product catalog (line-based format)
├── 99-typeart.rules                 # Linux udev rules for HID access
├── firmware/
│   ├── lux40v2_via.bin             # VIA-enabled QMK firmware for Lux40v2
│   └── lux36_via.bin               # VIA-enabled QMK firmware for Lux36
└── keyboards/
    ├── index.json                   # Registry: [{name, path, vendorId, productId, firmware?}]
    ├── space65r3/definition.json    # Graystudio Space65 R3 (0x4753:0x3003)
    ├── lux40v2/definition.json     # Lux40v2 (0x4C4D:0x0001, 4×14, 1 encoder)
    └── lux36/definition.json       # Lux36 (0x4C4D:0x0002, 4×11, QAZ-style 36-key)
```

## Adding a Keyboard Definition

1. Create `static/keyboards/<name>/definition.json` in VIA v3 format:

```json
{
  "name": "My Board",
  "vendorId": "0x1234",
  "productId": "0x5678",
  "matrix": { "rows": 5, "cols": 15 },
  "layouts": {
    "labels": [["Backspace", "2u", "Split"]],
    "keymap": [["0,0", "0,1", {"w": 2}, "0,2\n\n\n0,0"]]
  }
}
```

2. Add to `static/keyboards/index.json`:

```json
{ "name": "My Board", "path": "my-board", "vendorId": "0x1234", "productId": "0x5678" }
```

Matrix position `"row,col"` in KLE legend 0. Layout options `"group,choice"` in legend 3.

## Tech Stack

| What | Version | Notes |
|---|---|---|
| SvelteKit | 2.x | adapter-node for server + prerendered static pages |
| Svelte | 5.x | Runes ($state, $derived, $effect, $props) |
| TypeScript | 5.x | Type safety for protocol byte manipulation |
| Vite | 7.x | Dev server + builds |
| better-sqlite3 | 11.x | SQLite with WAL mode for user accounts + scores |
| @node-rs/argon2 | 2.x | Argon2id password hashing |
| pnpm | 10.x | Package manager |

## Known Limitations

- **No macro editor** — macros display as M(0)–M(15) but no UI to edit sequences
- **Encoder rotation not detectable in matrix tester** — VIA's `getSwitchMatrixState` only reports physical switches; encoder rotation is processed internally by QMK. Encoder push buttons also require matrix wiring to appear
- **Encoder VIA support requires firmware flag** — `encoder_map: true` must be in QMK `keyboard.json` features for VIA commands `0x14`/`0x15` to work
- **No lighting panel** — RGB/backlight keycodes assignable but no dedicated config UI
- **Import writes key-by-key** — could use `DynamicKeymapSetBuffer` for bulk writes
- **Single device** — one keyboard at a time
- **No payment processing** — checkout disabled pending payment gateway integration
- **Game page hidden** — Asteroid Run (`/game`) removed from nav, route still exists for future rework

## Roadmap

### Done

- [x] **Phase 1 — Adapter & Database**: Swapped `adapter-static` → `adapter-node`, added `better-sqlite3` with WAL mode, schema for users/sessions/typing_scores, per-route prerender flags for static pages
- [x] **Phase 2 — Auth**: Argon2id password hashing, session-based cookies (30-day), register/login/logout/me API routes, rate limiting, `hooks.server.ts` middleware, client-side `authStore`, login/register page, navbar auth UI
- [x] **Phase 3 — Typing Leaderboards**: Score submission API (anti-cheat: WPM cap 300, min chars, elapsed time), public leaderboard API, personal bests/recent scores, "Submit Score" button on typing test finish screen, `Leaderboard.svelte` component
- [x] **Phase 4 — Order Tracking**: Orders + order_items DB tables (prices in integer cents), transactional order creation, `POST /api/orders` (auth + rate limited), `GET /api/orders` + `GET /api/orders/[id]`, cart checkout flow with auth redirect, `/orders` history page, `/orders/[id]` detail page, "Orders" nav link (checkout disabled pending payment integration)
- [x] **Phase 5 — Deployment (Raspberry Pi 5)**: NVMe SSD, systemd service, nginx reverse proxy, Cloudflare Tunnel (typeart.co), daily SQLite backup cron with 7-day retention

## Changelog

### 2026-02-15

**Deployment (Phase 5)**
- Deployed to Raspberry Pi 5 (NVMe SSD, 108GB free)
- Systemd service (`typeart.service`): runs `node build` on port 3000, auto-restart on failure, enabled on boot
- Nginx reverse proxy: port 80 → 3000 with WebSocket upgrade headers
- Cloudflare Tunnel: site live at `https://typeart.co` — no port forwarding, HTTPS via Cloudflare
- Daily SQLite backup cron at 3 AM (`scripts/backup-db.sh`), WAL-safe `.backup`, 7-day retention

**Order tracking (Phase 4)**
- Added `orders` and `order_items` database tables (prices stored as integer cents to avoid floating point)
- Server module (`src/lib/server/orders.ts`): transactional order creation, user-scoped queries with ownership checks
- API routes: `POST /api/orders` (auth required, rate limited 10/15min), `GET /api/orders` (user's orders), `GET /api/orders/[id]` (detail with items)
- Order history page (`/orders`): date, status badge, item count, total; links to detail
- Order detail page (`/orders/[id]`): itemized list with color swatches, variants, quantities, line totals
- Cart checkout disabled pending payment gateway integration

**Typing test leaderboard**
- Top 10 leaderboard loads below score display after finishing a typing test
- Refreshes after submitting a score so user sees their ranking immediately

**Firmware downloads**
- VIA-enabled QMK firmware binaries served from `static/firmware/` (Lux40v2, Lux36)
- SHA256 checksums in registry and on hover in configure page
- Configure page: green hover border on boards with firmware, download link next to keyboard title

**UI cleanup**
- Navbar: account dropdown (username click → Orders, Log out), removed Game link, fixed link height alignment
- Removed Space65 R1 and TypeArt 65 placeholder definitions

### 2026-02-13

**Lux36 keyboard reverse engineering + firmware**
- Reverse engineered `luxqaz_default.bin` (STM32F072, VID 0x4C4D, PID 0x0002): extracted USB descriptors, 4-layer keymap (4×11 matrix), and GPIO pin assignments from compiled binary
- Created VIA v3 definition at `static/keyboards/lux36/definition.json` with QAZ-style staggered layout
- Compiled VIA-compatible QMK firmware (`qmk_firmware/keyboards/lux36/`) with corrected pin mapping extracted from original binary (cols: B14–A2, rows: A10–B15)

**Backend: auth, database, leaderboards**
- Swapped `adapter-static` → `adapter-node` for server-side routes; static pages retain per-route `prerender = true`
- Added SQLite database (`better-sqlite3`, WAL mode) with users, sessions, typing_scores tables
- Auth system: Argon2id hashing (`@node-rs/argon2`), 30-day session cookies, register/login/logout/me API routes, in-memory rate limiting
- Server hooks (`hooks.server.ts`): session parsing middleware, hourly cleanup of expired sessions + rate limits
- Client-side `authStore` (class-based `$state()`) with login/register/logout methods
- Login/register page (`/login`) with tabbed form, server-side redirect if already logged in
- Navbar auth UI: shows username + Log out when logged in, Log in link otherwise
- Score submission: POST `/api/scores` (auth required, rate limited, anti-cheat validation), GET leaderboard (public), personal bests/recent scores
- "Submit Score" button on typing test finish screen (or "Log in to save scores" link)
- `Leaderboard.svelte` component: ranked table with user, WPM, accuracy

### 2026-02-12

**Theme system**
- Added switchable colorways: Retro Beige (default), Miami Nights, and Godspeed
- Theme button in navbar (left of Configure) with cyan→violet→pink gradient border
- Miami Nights: dark indigo base with neon cyan/pink accents (synthwave aesthetic)
- Godspeed: warm cream base with NASA gold/powder blue accents (Apollo mission control)
- Logo colors, card hover gradients, and all UI tokens adapt per theme
- Theme persists to localStorage via `themeStore` (`src/lib/stores/theme.svelte.ts`)

### 2026-02-11

**Lux40v2 keyboard support**
- Added Lux40v2 definition (swordfshh, 0x4C4D:0x0001, 4×14 matrix, 1 rotary encoder)

**KLE parser fix**
- Fixed y-offset handling in `kle-parser.ts`: `curY += props.y - 1` was wrong — y offsets are additive, not replacements for auto-increment. Removed `firstKeyInRow` conditional entirely

**Matrix tester byte-offset fix**
- Fixed `getSwitchMatrixState()` in `via-protocol.ts`: QMK writes matrix data at `data[3]` (`command_data = &data[1]`, matrix at `command_data[2]`), was reading from `data[2]`

**Rotary encoder support**
- Encoders defined in `KeyboardDefinition.encoders[]` with `{x, y, w?, h?, push?}` position/size
- Each encoder generates two virtual `ParsedKey` entries (CCW/CW) with `encoder: {id, direction}` discriminator — reuses existing key selection + keycode picker flow
- `definitionStore` generates encoder virtual keys, appends to `activeKeys`
- `keymapStore` manages `encoderKeymap[layer][encoderId][direction]`, routes reads/writes through encoder-specific VIA protocol commands (`0x14`/`0x15`)
- `Key.svelte` renders encoder keys as circular buttons with violet border and direction indicators (↺ CCW, ↻ CW)
- `KeyboardLayout.svelte` uses `keyId()` helper for unified key identity (matrix `"row,col"` vs encoder `"enc:id:dir"`)
- Export/import preserves encoder keycodes in optional `encoders` field
- Encoder loading is resilient — falls back to zeros if firmware doesn't support `encoder_map`

### 2026-02-10

**Keycode system overhaul**
- Rewrote `catalog.ts`: fixed entire media/consumer range (0xA5–0xBE) to match VIA's mapping, fixed Print Screen collision (was 0x3A/F1, now 0x46), added ~60 keycodes (Grave Escape, Space Cadet, shifted symbols, macros M0–M15, mouse keys, F13–F24)
- Reorganized from 10 categories to 6 VIA-like categories (Basic, Media, Macro, Layers, Special, Lighting)
- Added QMK string parser (`parser.ts`) for "Any" key input — supports hex, named codes, LT/MT/MO/TG/OSM
- Added `AnyKeyInput.svelte` (text input with live preview) and `CompoundKeycodeBuilder.svelte` (visual LT/MT builder)
- KeycodePicker now always visible when keymap loaded (not gated behind key selection)

**HID transport reliability**
- Added command queue to `hid-transport.ts` — serializes all HID communication to prevent overlapping requests causing protocol corruption and device disconnects
- Fixed `handleInputReport` to use proper `byteOffset`/`byteLength` from DataView

**Matrix tester fix**
- Fixed bit-unpacking byte order: QMK packs switch matrix state big-endian (MSB first), code was reading little-endian — ESC at col 0 was showing as col 8

**Layout centering**
- `KeyboardLayout.svelte` now computes minX/minY offset from all keys and applies CSS translate, eliminating dead space for boards like Space65 whose KLE starts at x=2.5

**Keyboard definitions**
- Added Graystudio Space65 R1 (0x4753:0x3000) and R3 (0x4753:0x3003) definitions
- Fixed VID/PID auto-detection: AND vs OR logic, case-insensitive hex compare

**Connection reliability**
- Fixed race condition: transport callback set `connected` before `transport`/`protocol` assigned to store
- Fixed reconnect: blank keymap on second connect due to stale `$effect` guard

**Visual refresh**
- Rethemed from Solarized Dark to vintage Macintosh beige with Apple rainbow accents
- Logo: Courier Prime italic (loaded from Google Fonts), per-letter muted rainbow colors
- Home page: Store card full-width on top, Configure/Matrix Test side-by-side below, rainbow gradient border on hover with rounded corners
- Linux udev rules file (`static/99-typeart.rules`) for HID device permissions
