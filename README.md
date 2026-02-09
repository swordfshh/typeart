# TypeArt

Live keymap editor for custom QMK keyboards over WebHID. Connect a VIA-enabled keyboard, visualize the layout, click a key, pick a new keycode, and it writes to the firmware instantly.

## Quick Start

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # static site → build/
pnpm preview    # preview production build
pnpm check      # type-check
```

Requires **Node.js 22** (via nvm) and **pnpm**. WebHID only works in **Chrome/Edge**.

## What It Does

- **Configure** (`/configure`) — connect a VIA keyboard, see its layout rendered from the definition JSON, click any key to reassign it from a searchable keycode picker, switch layers, toggle layout options, import/export keymaps as JSON
- **Matrix Test** (`/test`) — polls the switch matrix at ~60Hz and highlights physically pressed keys in real time
- **Home** (`/`) — landing page with WebHID compatibility check and nav cards

## Architecture

Four layers, each depending only on the one below it:

```
UI Components (Svelte)
    ↓ reads/writes
Stores (Svelte 5 runes)
    ↓ calls
Protocol (VIA command encoder/decoder)
    ↓ sends/receives 32-byte reports
Transport (WebHID)
    ↓ USB HID
QMK Keyboard (STM32)
```

### Transport — `src/lib/transport/hid-transport.ts`

`HIDTransport` class. Manages one HID device connection.

- Filters devices by `usagePage: 0xFF60, usage: 0x61` (VIA's raw HID interface)
- Every report is exactly **32 bytes**, report ID `0x00`
- `sendCommand(data)` sends a report and returns a `Promise<Uint8Array>` that resolves when the keyboard replies (or rejects after 1 second)
- `sendRaw(data)` sends without waiting for a response
- Listens for `navigator.hid` disconnect events and fires `onDeviceDisconnect`
- `requestDevice()` opens the browser picker; `connect()` with no args tries to reconnect to a previously paired device

### Protocol — `src/lib/protocol/`

`ViaProtocol` class. Takes an `HIDTransport`, provides typed async methods:

| Method | VIA Command | What it does |
|---|---|---|
| `getProtocolVersion()` | `0x01` | Returns protocol version (e.g. 12) |
| `getLayerCount()` | `0x11` | Number of layers |
| `getFullKeymap(layers, rows, cols)` | `0x12` (bulk) | Reads entire keymap via `DynamicKeymapGetBuffer`, 28 bytes per round trip. A 4-layer 5x15 board = 600 bytes = 22 requests (~50ms) |
| `setKeycode(layer, row, col, kc)` | `0x05` | Writes one 16-bit keycode |
| `getKeycode(layer, row, col)` | `0x04` | Reads one keycode |
| `getLayoutOptions()` / `setLayoutOptions(n)` | `0x02` | Layout variant bitmask |
| `getSwitchMatrixState()` | `0x03` | Bitfield of currently pressed switches |
| `getFirmwareVersion()` | `0x04` value | 32-bit firmware version |

Command IDs and keyboard value IDs are in `commands.ts`. Protocol constants (report size, chunk size) are in `constants.ts`.

**Byte encoding**: keycodes are 16-bit big-endian (high byte first). The `DynamicKeymapGetBuffer` response format is `[cmd, offset_hi, offset_lo, size, ...data]`.

### Keyboard Definitions — `src/lib/keyboard/`

**Types** (`types.ts`):
- `KeyboardDefinition` — VIA v3 JSON format: name, vendorId, productId, matrix dimensions, layouts (labels + KLE keymap)
- `ParsedKey` — one key's position/size/rotation/matrix-coords after parsing
- `KLERow`, `KLEKeyProperties` — raw KLE format types

**KLE Parser** (`kle-parser.ts`):
- `parseKLELayout(rows)` — converts VIA's KLE-style JSON into `ParsedKey[]`
- Each KLE row is an array of strings and property objects
- Matrix position: `"row,col"` in legend index 0 (top-left, separated by `\n`)
- Layout options: `"group,choice"` in legend index 3 (bottom-right)
- Property objects set `x`, `y` (offsets), `w`, `h` (size), `r`, `rx`, `ry` (rotation)
- `filterKeysByLayoutOptions(keys, selections)` — returns only keys matching current layout choices; keys with `optionGroup === -1` always show

**Definition Loader** (`definition.ts`):
- `fetchKeyboardRegistry()` — loads `static/keyboards/index.json`
- `fetchKeyboardDefinition(path)` — loads `static/keyboards/<path>/definition.json`
- `findDefinitionForDevice(vid, pid)` — matches connected device to a definition by vendor/product ID
- `getLayoutOptions(def)` — extracts layout option labels/choices from the definition

### Keycodes — `src/lib/keycodes/`

**Ranges** (`ranges.ts`): QMK keycode range constants — `QK_BASIC_MIN/MAX`, `QK_LAYER_TAP_MIN/MAX`, `QK_MOD_TAP_MIN/MAX`, `QK_MOMENTARY_MIN/MAX`, etc.

**Catalog** (`catalog.ts`): ~180 explicitly listed keycodes across 10 categories:

| Category | Examples | Count |
|---|---|---|
| Basic | A-Z, 0-9, Enter, Space, punctuation | 42 |
| Modifiers | LCtrl, LShift, LAlt, LGui, R-variants | 8 |
| Navigation | Arrows, Home, End, PgUp, PgDn, Insert, Delete | 13 |
| Function | F1-F24 | 24 |
| Numpad | KP 0-9, KP operators | 18 |
| Media | Vol Up/Down, Mute, Play, Next, Prev, Brightness | 9 |
| Layers | MO(0-7), TG(0-7), TO(0-3), TT(0-3), OSL(0-3), DF(0-3) | 32 |
| Quantum | Bootloader, Reboot, Debug, Clear EEPROM | 5 |
| Lighting | BL toggle/step/on/off/up/down, RGB toggle/mode/hue/sat/val/speed | 17 |
| Mouse | Mouse movement, buttons, scroll wheel | 9 |

Each entry: `{ code, name, label, shortLabel }`. Flat lookup via `getKeycodeEntry(code)`.

**Labels** (`labels.ts`): `getKeycodeLabel(keycode)` handles any 16-bit value:
- Direct catalog lookup first
- Then parameterized ranges: `LT(layer,kc)` = `0x4000 | (layer<<8) | kc`, `MT(mod,kc)` = `0x2000 | (mod<<8) | kc`, `MO(layer)` = `0x5220 | layer`, etc.
- Modifier bitmask decoding for Mod-Tap and Mods keycodes
- Fallback: hex like `0x1234`

### Stores — `src/lib/stores/`

All stores use Svelte 5 runes (`$state`, `$derived`). Each is a singleton class instance.

**`deviceStore`** (`device.svelte.ts`):
- Fields: `transport`, `protocol`, `connectionState`, `deviceName`, `protocolVersion`, `error`
- `connect()` — opens browser picker, connects, verifies protocol version
- `reconnect()` — tries to reconnect to a previously paired device (no picker)
- `disconnect()` — closes connection, resets all fields
- Auto-resets on device disconnect

**`keymapStore`** (`keymap.svelte.ts`):
- Fields: `keymap` (3D array `[layer][row][col]`), `activeLayer`, `selectedKey`, `layerCount`, `loading`
- `loadFromDevice(rows, cols)` — reads layer count then bulk-reads the full keymap
- `setKeycode(layer, row, col, kc)` — optimistic local update + writes to device
- `selectKey(key)` / `deselectKey()` / `setActiveLayer(n)` — UI selection state
- `importKeymap(keymap)` — loads a 3D array and writes every key to the device

**`definitionStore`** (`definition.svelte.ts`):
- Fields: `definition`, `allKeys`, `layoutOptionValues`, `layoutOptions`, `registry`, `loading`
- Derived: `activeKeys` (filtered by layout options), `rows`, `cols`
- `loadRegistry()` — fetches keyboard list
- `loadDefinition(path)` / `loadForDevice(vid, pid)` — loads and parses a definition
- `setLayoutOption(group, choice)` — re-filters visible keys

### Components — `src/components/`

| Component | Props | What it does |
|---|---|---|
| `Key.svelte` | `parsedKey`, `keycode`, `selected`, `pressed`, `unitSize`, `onclick` | Absolutely positioned key button. Derives label from keycode. Hover = blue border, selected = yellow glow, pressed = cyan fill. 1u = 54px default. Handles rotation via CSS `transform-origin` + `rotate`. |
| `KeyboardLayout.svelte` | `keys`, `keycodes(row,col)`, `selectedRow`, `selectedCol`, `pressedKeys`, `unitSize`, `onkeyclick` | Container that renders `Key` for each `ParsedKey`. Computes bounding box from key positions. `keycodes` is a callback, not a data array — the layout calls it per-key. |
| `KeycodePicker.svelte` | `currentKeycode`, `onselect`, `onclose` | Category tabs + keycode grid + search. Search is cross-category. Shows current keycode info. Escape to close. |
| `LayerSelector.svelte` | `layerCount`, `activeLayer`, `onselect` | Horizontal tab bar for layers 0 through N-1. |
| `ConnectionStatus.svelte` | (reads `deviceStore` directly) | Shows connection state: disconnected (gray dot + connect button), connecting (yellow pulsing dot), connected (cyan glowing dot + device name + protocol version + disconnect button), error (red dot + message). |
| `ImportExport.svelte` | (reads stores directly) | Export button (downloads JSON), import button (file picker, validates, writes to device). |

### Pages / Routes

**`/`** (`routes/+page.svelte`) — hero heading, WebHID check warning, nav cards to Configure and Test.

**`/configure`** (`routes/configure/+page.svelte`) — the main editor. Flow:
1. `onMount`: load registry, try auto-reconnect
2. `$effect`: when `deviceStore.isConnected` changes, auto-detect definition and load keymap
3. Layout options dropdowns (if definition has them)
4. Layer tabs
5. Keyboard layout (click a key to select it)
6. Keycode picker (slides in when a key is selected, closes on Escape or close button)
7. Can also manually load a definition for offline browsing

**`/test`** (`routes/test/+page.svelte`) — matrix tester. Polls `getSwitchMatrixState()` every 16ms (~60Hz). Parses the bitfield into a `Set<"row,col">` and passes it to `KeyboardLayout` as `pressedKeys`. Shows a live list of pressed key coordinates below the layout.

**`+layout.svelte`** — nav bar (TypeArt logo + Configure / Test links) + `<main>` slot. Imports `app.css`.

**`+layout.ts`** — `export const prerender = true` (required by adapter-static).

## Design System

Solarized dark via CSS custom properties in `src/app.css`:

| Token | Value | Use |
|---|---|---|
| `--base03` | `#002b36` | Page background |
| `--base02` | `#073642` | Card/panel/key background |
| `--base01` | `#586e75` | Borders, muted text, scrollbar |
| `--base00` | `#657b83` | Secondary text, hints |
| `--base0` | `#839496` | Body text |
| `--base1` | `#93a1a1` | Emphasis text, headings |
| `--yellow` | `#b58900` | Selected state, accent |
| `--orange` | `#cb4b16` | Warnings |
| `--red` | `#dc322f` | Errors, destructive actions |
| `--blue` | `#268bd2` | Links, primary actions, hover |
| `--cyan` | `#2aa198` | Connected state, pressed keys, success |
| `--green` | `#859900` | Confirm, active |
| `--violet` | `#6c71c4` | (available, unused so far) |
| `--magenta` | `#d33682` | (available, unused so far) |

Radii: `--radius-sm` (4px), `--radius-md` (8px), `--radius-lg` (12px).
Shadows: `--shadow-sm`, `--shadow-md`.

Transitions are 100ms ease on borders/backgrounds. The keycode picker slides in with a 150ms animation.

## File Map

```
src/
├── app.css                          # Design tokens, global reset
├── app.html                         # HTML shell
├── app.d.ts                         # SvelteKit type declarations
├── lib/
│   ├── transport/
│   │   └── hid-transport.ts         # HIDTransport class (WebHID)
│   ├── protocol/
│   │   ├── commands.ts              # ViaCommand and KeyboardValue enums
│   │   ├── constants.ts             # REPORT_SIZE, BUFFER_CHUNK_SIZE, KEYCODE_SIZE
│   │   └── via-protocol.ts          # ViaProtocol class
│   ├── keyboard/
│   │   ├── types.ts                 # KeyboardDefinition, ParsedKey, KLE types
│   │   ├── kle-parser.ts            # parseKLELayout, filterKeysByLayoutOptions
│   │   └── definition.ts            # fetch/find definition, getLayoutOptions
│   ├── keycodes/
│   │   ├── ranges.ts                # QMK keycode range constants
│   │   ├── catalog.ts               # ~180 keycodes in 10 categories, getKeycodeEntry
│   │   └── labels.ts                # getKeycodeLabel (handles parameterized keycodes)
│   ├── stores/
│   │   ├── device.svelte.ts         # deviceStore — connection lifecycle
│   │   ├── keymap.svelte.ts         # keymapStore — 3D keymap, selection, writes
│   │   └── definition.svelte.ts     # definitionStore — definition, parsed keys, layout options
│   └── utils/
│       ├── bytes.ts                 # readUint16BE, writeUint16BE, toHex
│       └── export.ts                # exportKeymap, parseImportedKeymap, downloadJson
├── components/
│   ├── Key.svelte                   # Single key (position, label, states)
│   ├── KeyboardLayout.svelte        # Renders all keys in absolute layout
│   ├── KeycodePicker.svelte         # Category tabs + search + grid
│   ├── LayerSelector.svelte         # Layer tab bar
│   ├── ConnectionStatus.svelte      # Connect/disconnect button + status
│   └── ImportExport.svelte          # Export/import keymap as JSON
└── routes/
    ├── +layout.svelte               # Nav bar + main slot
    ├── +layout.ts                   # prerender = true
    ├── +page.svelte                 # Home page
    ├── configure/+page.svelte       # Keymap editor
    └── test/+page.svelte            # Matrix tester

static/keyboards/
├── index.json                       # Registry: [{name, path, vendorId, productId}]
└── typeart65/
    └── definition.json              # Sample 65% keyboard (5x15 matrix)
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
    "keymap": [
      ["0,0", "0,1", {"w": 2}, "0,2\n\n\n0,0"]
    ]
  }
}
```

2. Add an entry to `static/keyboards/index.json`:

```json
{ "name": "My Board", "path": "my-board", "vendorId": "0x1234", "productId": "0x5678" }
```

The keymap array uses KLE format. Each string is `"row,col"` (matrix position in legend 0). Layout option keys add `"\n\n\ngroup,choice"` in legend 3. Property objects before a key set `w`, `h`, `x`, `y`, `r`, `rx`, `ry`.

## Protocol Cheat Sheet

All HID reports are **32 bytes**, report ID `0x00`, sent to usage page `0xFF60` usage `0x61`.

| Action | Bytes sent | Response |
|---|---|---|
| Get protocol version | `01 00 ...` | `01 VV VV ...` (16-bit version) |
| Get layer count | `11 00 ...` | `11 NN ...` (8-bit count) |
| Get keycode | `04 LL RR CC ...` | `04 LL RR CC HH LL ...` (16-bit keycode) |
| Set keycode | `05 LL RR CC HH LL ...` | `05 ...` (echo) |
| Get buffer (bulk) | `12 OH OL SZ ...` | `12 OH OL SZ DD DD ...` (28 data bytes max) |
| Get layout options | `02 02 ...` | `02 02 B3 B2 B1 B0 ...` (32-bit bitmask) |
| Get matrix state | `02 03 ...` | `02 03 BB BB BB ...` (bitfield, 1 bit per switch) |

Keycodes are 16-bit big-endian. Parameterized:
- `LT(layer, kc)` = `0x4000 | (layer << 8) | kc`
- `MO(layer)` = `0x5220 | layer`
- `TG(layer)` = `0x5260 | layer`
- `MT(mod, kc)` = `0x2000 | (mod << 8) | kc`
- Modifier bits: `0x01` Ctrl, `0x02` Shift, `0x04` Alt, `0x08` GUI, `0x10` = right-side flag

## Tech Stack

| What | Version | Why |
|---|---|---|
| SvelteKit | 2.50 | Compiled framework, no runtime, fastest option |
| Svelte | 5.50 | Runes for reactive state without external libraries |
| TypeScript | 5.9 | Type safety for protocol byte manipulation |
| Vite | 7.3 | Fast HMR and builds |
| adapter-static | 3.0 | Prerendered output for GitHub Pages |
| pnpm | 10.x | Fast, strict package manager |

Zero runtime dependencies. Everything is a dev dependency compiled away at build time.

## Known Limitations

- **Keycode catalog is partial** — covers ~180 common keycodes. Uncommon QMK keycodes (international, macro slots beyond the picker, custom keycodes) fall back to hex display. The `labels.ts` parameterized decoder handles the full 16-bit range; only the picker catalog needs expanding.
- **No macro editor** — macros show as `M(0)`, `M(1)` etc. but there's no UI to edit macro sequences. The protocol commands for macro buffer read/write (`0x0C`-`0x10`) exist in the command enum but aren't wired up.
- **No encoder support** — rotary encoder keycodes (`DynamicKeymapGetEncoder` `0x14` / `SetEncoder` `0x15`) are defined in the command enum but not exposed in the UI.
- **No lighting controls** — RGB/backlight keycodes can be assigned but there's no dedicated lighting configuration panel.
- **Import writes key-by-key** — importing a full keymap writes each keycode individually via `setKeycode`. Could be faster using `DynamicKeymapSetBuffer` (`0x13`) for bulk writes.
- **Single device** — only one keyboard connected at a time.
- **Sample definition only** — ships with one placeholder 65% definition. Real definitions need to be added per-keyboard.

## Future Phases

Stubbed routes exist at `/store` and `/game` for future expansion:

- **Store** (`/store`) — product pages for keyboard kits, purchase flow
- **Typing Game** (`/game`) — interactive typing test using the connected keyboard
- **Macro Editor** — sequence builder using the existing macro buffer protocol commands
- **Lighting Panel** — RGB/backlight controls pulled from definition menus
- **Encoder UI** — rotary encoder keycode assignment
- **Bulk buffer writes** — use `DynamicKeymapSetBuffer` for faster keymap imports
- **localStorage** — persist last device and definition for faster reconnect

## Deployment

The build output is a fully static site in `build/`. Deploy to any static host. For GitHub Pages:

```bash
pnpm build
# push build/ to gh-pages branch, or configure GitHub Actions
```

WebHID requires HTTPS (GitHub Pages provides this automatically).
