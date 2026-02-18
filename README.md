# TypeArt

Keyboard-first e-commerce store with built-in live keymap editor and matrix tester. Connect a VIA-enabled QMK keyboard over WebHID, visualize the layout, reassign keys from a searchable picker, and flash changes instantly — all in the browser.

Built on [QMK](https://qmk.fm) (open-source keyboard firmware) and [VIA](https://usevia.app) (keyboard configuration protocol and definition library).

## Quick Start

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # Node server → build/
node build      # run production server
pnpm preview    # preview production build
pnpm check      # type-check

# Deploy (build + restart service)
pnpm build && sudo systemctl restart typeart
```

Requires **Node.js 22+** and **pnpm**. WebHID only works in **Chrome/Edge**. On Linux, install udev rules: `sudo cp static/99-typeart.rules /etc/udev/rules.d/ && sudo udevadm control --reload-rules`.

## Pages

| Route | Purpose |
|---|---|
| `/` | Landing — rainbow-lettered logo, 2×2 nav cards (Store · Configure · Typing Test · Matrix Test) |
| `/store` | Product grid — keyboard kits with photo gallery, color/stabilizer/wrist rest pricing, cart with localStorage |
| `/configure` | Live keymap editor — connect keyboard, auto-detect definition, click-to-reassign keys, always-visible keycode picker with search/categories/LT-MT builder/"Any" key input |
| `/test` | Matrix tester — polls switch state at ~60Hz, highlights pressed keys in real time |
| `/type` | Typing speed test — time/words/quote modes, inline stats + leaderboard toggles in settings bar, score submission + leaderboard on finish |
| `/store/checkout/success` | Checkout success — order confirmation, clears cart, links to order detail |
| `/orders` | Order history — list of placed orders with status, links to detail |
| `/orders/[id]` | Order detail — itemized breakdown with color, variants, totals |
| `/login` | Login/register — tabbed form, session-based auth |
| `/forgot-password` | Password reset request — sends email with reset link |
| `/reset-password` | Password reset — token-validated new password form |
| `/settings` | Account settings — change password, delete account |
| `/display` | Kiosk dashboard — full-screen stats display for 7" HDMI (revenue, orders, users, typing tests, recent orders, popular products, inventory). Auto-refreshes every 30s |
| `/about` | About page — brand story, keyboard build guide, layout explanations, tools overview, internal cross-links |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/sitemap.xml` | XML sitemap with all public pages and product image tags |
| `/feeds/products.xml` | Google Merchant Center product feed (RSS 2.0 with g: namespace) |
| `+error.svelte` | Custom 404/error page with status code and back-to-home link |

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
- **`definition.ts`** — fetch registry, load definitions, match by VID/PID (strips `0x` prefix, case-insensitive hex compare). Falls back to VIA's online library (usevia.app) for keyboards not in the local registry, converting pre-parsed key data to `ParsedKey[]`

### Keycodes — `src/lib/keycodes/`

- **`ranges.ts`** — QMK keycode range constants (layer tap, mod tap, momentary, toggle, etc.)
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
| **Retro Beige** | Vintage Macintosh Platinum era | Warm beige `#E8DCC6` | Apple rainbow |
| **Miami Nights** (default) | Dark synthwave | Deep indigo `#0f0e17` | Neon cyan `#0AD2D3` + hot pink `#FF2E97` |
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

**Favicon**: SVG tab icon — "TA" in Courier New italic with stroke-width 1.33. T in Miami Nights cyan (`#0AD2D3`), A in hot pink (`#FF2E97`). Served from `static/favicon.svg`.

**Font loading**: Courier Prime loaded from Google Fonts in `app.html` (ital + wght variants).

## File Map

```
src/
├── app.css                          # Design tokens (vintage Macintosh beige), global reset
├── app.html                         # HTML shell + favicon + Google Fonts (Courier Prime)
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
│   │   ├── types.ts                 # Product, ColorOption, StabilizerOption, CartItem types
│   │   └── parser.ts                # products.txt line-based parser (colors/stabilizers with pricing)
│   ├── stores/
│   │   ├── device.svelte.ts         # deviceStore — connection lifecycle
│   │   ├── keymap.svelte.ts         # keymapStore — 3D keymap, selection, writes
│   │   ├── definition.svelte.ts     # definitionStore — parsed keys, layout options
│   │   ├── cart.svelte.ts           # cartStore — localStorage-persisted cart
│   │   ├── theme.svelte.ts         # themeStore — theme switcher with localStorage
│   │   └── auth.svelte.ts          # authStore — user state, login/register/logout
│   ├── server/
│   │   ├── db.ts                    # SQLite (better-sqlite3, WAL mode, schema init, graceful shutdown)
│   │   ├── auth.ts                  # register, login, sessions, password change, account deletion (Argon2id, timing-safe, lockout)
│   │   ├── rate-limit.ts            # SQLite-backed sliding window rate limiter
│   │   ├── scores.ts               # Score validation (cross-field checks), submission, leaderboard queries
│   │   ├── orders.ts               # Order creation (transactional, server-side price validation incl. color/stabilizer surcharges)
│   │   ├── stripe.ts               # Stripe client singleton (lazy init) + webhook secret
│   │   ├── email.ts                # Email service (Resend) — password reset, order confirmation
│   │   └── security-log.ts         # Security event logger (login, lockout, password change, deletion)
│   └── utils/
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
├── hooks.server.ts                  # Session parsing, CSRF protection, security headers, cleanup intervals
└── routes/
    ├── +layout.svelte               # Nav bar (rainbow logo, account dropdown, mobile hamburger) + footer + main slot; bypassed for /display
    ├── +layout.server.ts            # Pass user to all pages
    ├── +error.svelte                # Custom 404/error page
    ├── +page.svelte                 # Home (2×2 nav cards: Store · Configure · Typing Test · Matrix Test)
    ├── configure/+page.svelte       # Keymap editor
    ├── test/+page.svelte            # Matrix tester
    ├── type/+page.svelte            # Typing speed test + inline stats/leaderboard + score submission
    ├── login/+page.svelte           # Login/register tabbed form
    ├── settings/+page.svelte         # Account settings (change password, delete account)
    ├── forgot-password/+page.svelte # Password reset request
    ├── reset-password/+page.svelte  # Token-validated password reset
    ├── about/+page.svelte            # About page (brand story, build guide, tools)
    ├── privacy/+page.svelte         # Privacy policy
    ├── terms/+page.svelte           # Terms of service
    ├── sitemap.xml/+server.ts       # XML sitemap (prerendered)
    ├── feeds/products.xml/+server.ts # Google Merchant Center product feed (prerendered)
    ├── display/
    │   ├── +page.server.ts          # Dashboard stats queries (users, orders, revenue, typing tests, popular products, inventory)
    │   └── +page.svelte             # Full-screen kiosk dashboard (Miami Nights, auto-refresh, live clock, inventory)
    ├── orders/
    │   ├── +page.svelte             # Order history list
    │   └── [id]/+page.svelte        # Order detail with itemized breakdown
    ├── api/
    │   ├── auth/{register,login,logout,me,forgot-password,reset-password,change-password,delete-account}/+server.ts
    │   ├── scores/{+server.ts,me/+server.ts}           # Score API routes
    │   ├── orders/{+server.ts,[id]/+server.ts}         # Order API routes
    │   ├── checkout/+server.ts      # Stripe Checkout Session creation (POST)
    │   ├── stock/+server.ts         # GET stock levels per product slug
    │   └── webhooks/stripe/+server.ts # Stripe webhook (payment confirmation, signature-verified)
    └── store/
        ├── +page.ts                 # Load: fetch & parse products.txt
        ├── +page.svelte             # Product listing grid
        ├── [slug]/+page.ts + .svelte # Product detail + variants
        ├── cart/+page.svelte        # Cart with qty controls + Stripe checkout
        └── checkout/success/        # Post-payment confirmation page (+page.server.ts + .svelte)

scripts/
└── backup-db.sh                     # Daily SQLite backup (WAL-safe, 7-day retention)

static/
├── favicon.svg                      # Browser tab icon (TA in Miami Nights cyan/pink)
├── logo-transparent.png             # TypeArt logo (Miami Nights, transparent background)
├── logo-dark.png                    # TypeArt logo (Miami Nights, dark background)
├── logo-miami.svg                   # TypeArt logo (scalable vector)
├── products.txt                     # Product catalog (line-based format with color/stabilizer pricing)
├── 99-typeart.rules                 # Linux udev rules for HID access
├── images/products/
│   ├── type-40/{1-5}.{jpg,webp}    # Type 40 product photos (JPEG + WebP, 1200×900)
│   └── type-qaz/{1-3}.{jpg,webp}   # Type QAZ product photos (JPEG + WebP)
├── firmware/
│   ├── lux40v2_via.bin             # VIA-enabled QMK firmware for Lux40v2
│   └── lux36_via.bin               # VIA-enabled QMK firmware for Lux36
└── keyboards/
    ├── index.json                   # Registry: TypeArt boards [{name, path, vendorId, productId, firmware?}]
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

## Deployment

Production runs on a Raspberry Pi 5 (NVMe SSD) behind nginx + Cloudflare Tunnel (`typeart.co`).

```bash
pnpm build && sudo systemctl restart typeart
```

**Always restart after building.** SvelteKit adapter-node lazy-loads server chunks by hashed filename. If you rebuild without restarting, the running Node process still references the old `manifest.js` with old chunk hashes. Any route not yet loaded will 500 with `ERR_MODULE_NOT_FOUND`. Routes that happened to be loaded before the build will appear to work, making the site look "half broken".

| Component | Config |
|---|---|
| Node server | `systemd` service on port 3000, `SHUTDOWN_TIMEOUT=3`, `TimeoutStopSec=10` |
| Reverse proxy | nginx on port 80, proxies to 3000, adds security headers |
| Tunnel | Cloudflare Tunnel → nginx → Node |
| Database | SQLite WAL mode, `db.close()` on SIGTERM/SIGINT/sveltekit:shutdown |
| Backups | Daily cron at 3 AM (`scripts/backup-db.sh`), WAL-safe `.backup`, 7-day retention |
| Kiosk display | `typeart-display.service`: cage (Wayland compositor) + Firefox ESR kiosk → `localhost:3000/display` on HDMI |

## Known Limitations

- **No macro editor** — macros display as M(0)–M(15) but no UI to edit sequences
- **Encoder rotation not detectable in matrix tester** — VIA's `getSwitchMatrixState` only reports physical switches; encoder rotation is processed internally by QMK. Encoder push buttons also require matrix wiring to appear
- **Encoder VIA support requires firmware flag** — `encoder_map: true` must be in QMK `keyboard.json` features for VIA commands `0x14`/`0x15` to work
- **No lighting panel** — RGB/backlight keycodes assignable but no dedicated config UI
- **Import writes key-by-key** — could use `DynamicKeymapSetBuffer` for bulk writes
- **Single device** — one keyboard at a time
- **No shipping address collection** — Stripe Checkout handles payment but shipping details not yet captured

## Roadmap

### To Do

**Critical — Blocks Purchasing**
- [x] **Checkout & payment** — Stripe Checkout (hosted), webhook-confirmed orders, confirmation emails
- [x] **Shipping address collection** — Stripe Checkout collects US shipping address, stored in DB, shown on order detail + confirmation email
- [x] **Product images** — Real product photos with gallery and thumbnail strip (zoom TBD)
- [ ] **Order status management** — Admin ability to update status (confirmed/shipped/delivered), tracking numbers, shipping notification emails

**High — Trust & Discoverability**
- [ ] **Shipping & return policy page** — Delivery timeframes, return window, refund process
- [x] **FAQ page** — Common questions about keyboards, shipping, compatibility (FAQ schema on about page)
- [ ] **Email verification** — Confirm email on registration before allowing orders
- [x] **SEO metadata** — Meta descriptions, Open Graph tags, Twitter Cards, JSON-LD structured data for products, sitemap.xml, canonical URLs, Google Merchant product feed
- [ ] **Product specs** — Dimensions, weight, materials, switch compatibility, what's included

**Medium — User Experience**
- [ ] **Store search & filtering** — Search bar, category filtering, sort by price/name
- [x] **Stock & inventory status** — Per-product inventory tracking, out of stock prevention, low stock indicators
- [ ] **Product reviews & ratings** — User-submitted reviews with star ratings
- [ ] **Welcome email** — Send on registration after email verification
- [ ] **Accessibility** — Skip-to-content link, ARIA labels on all interactive elements, aria-live regions for dynamic updates, focus trapping in modals

**Low — Nice to Have**
- [x] **About page** — Brand story, keyboard build guide, layout explanations, tools overview, internal cross-links, SEO-rich content
- [ ] **Related products / cross-sells** — "Customers also bought" on product pages
- [ ] **Wishlist** — Save products for later
- [ ] **PWA support** — Service worker, offline mode, "Add to Home Screen"
- [ ] **Order cancellation** — User-initiated cancellation for pending orders

### Done

- [x] **Phase 1 — Adapter & Database**: Swapped `adapter-static` → `adapter-node`, added `better-sqlite3` with WAL mode, schema for users/sessions/typing_scores, per-route prerender flags for static pages
- [x] **Phase 2 — Auth**: Argon2id password hashing, session-based cookies (30-day), register/login/logout/me API routes, rate limiting, `hooks.server.ts` middleware, client-side `authStore`, login/register page, navbar auth UI
- [x] **Phase 3 — Typing Leaderboards**: Score submission API (anti-cheat: WPM cap 300, min chars, elapsed time), public leaderboard API, personal bests/recent scores, "Submit Score" button on typing test finish screen, `Leaderboard.svelte` component
- [x] **Phase 4 — Order Tracking**: Orders + order_items DB tables (prices in integer cents), transactional order creation, `POST /api/orders` (auth + rate limited), `GET /api/orders` + `GET /api/orders/[id]`, cart checkout flow with auth redirect, `/orders` history page, `/orders/[id]` detail page, "Orders" nav link (checkout disabled pending payment integration)
- [x] **Phase 5 — Deployment (Raspberry Pi 5)**: NVMe SSD, systemd service, nginx reverse proxy, Cloudflare Tunnel (typeart.co), daily SQLite backup cron with 7-day retention
- [x] **Phase 6 — Email Service**: Resend integration for password reset flow (forgot-password → email → reset-password) and order confirmation emails
- [x] **Phase 7 — Security Hardening**: Server-side price validation against product catalog, security headers (CSP, X-Frame-Options, HSTS, etc.) in hooks + nginx, Argon2 timing-attack mitigation, generic registration errors, session tokens upgraded to randomBytes(32), SQLite-backed rate limiting, score validation hardening (cross-field checks, WPM cap 250)
- [x] **Phase 8 — UX Polish**: Per-page browser tab titles, custom 404/error page, site footer (privacy policy, terms of service, contact), inline personal stats on typing test page, mobile responsive navigation (hamburger menu below 640px), Miami Nights as default theme, per-theme button borders, graceful shutdown (db.close on SIGTERM, SHUTDOWN_TIMEOUT=3)
- [x] **Phase 9 — Security Hardening II**: Password change endpoint (invalidates other sessions), account deletion (GDPR right to erasure), CSRF protection (Origin header checking), leaderboard query param validation, nginx request body size limit (1MB), max 5 sessions per user, account lockout (5 failures = 15min, 10 = 1hr), security event logging (login/lockout/password change/deletion with IP)
- [x] **Phase 10 — Product Photos & Pricing**: Real product photos with image gallery, color surcharge system (ColorOption type, end-to-end pricing), stabilizer pricing, server-side price validation for all options, kiosk stats dashboard
- [x] **Phase 11 — Stripe Checkout**: Stripe Checkout (hosted) integration, webhook-confirmed orders with signature verification, idempotent payment processing, stale pending order cleanup, Miami Nights logo exports
- [x] **Phase 12 — Checkout Security Hardening**: Webhook event deduplication (prevents duplicate emails/replay attacks), atomic payment transaction, payment_status validation, dispute/failure/expiry webhook handlers, Stripe secret startup validation, CSP connect-src fix for Stripe domains
- [x] **Phase 13 — Shipping & Kit Acknowledgment**: Stripe Checkout collects US shipping address, webhook stores in DB, displayed on order detail/success pages and confirmation email, kit acknowledgment checkbox on product page
- [x] **Phase 14 — SEO & Discoverability**: Meta descriptions, OG tags, Twitter Cards, JSON-LD Product/ItemList/Organization/WebSite/BreadcrumbList/FAQPage schemas, canonical URLs, XML sitemap, Google Merchant Center product feed, about page with build guide and internal cross-linking, descriptive image alt text, WebP image optimization with `<picture>` tag fallbacks
- [x] **Phase 15 — Inventory Tracking**: Per-product stock table, atomic stock check + decrement in order transaction, stock API endpoint, out-of-stock UI on product/cart pages, inventory card on kiosk display

## Changelog

### 2026-02-17

**Inventory tracking**
- New `product_inventory` table (product_slug, quantity) with initial stock seeded on first run
- Server-side stock check + atomic decrement inside `createOrder()` transaction — rejects orders when stock insufficient
- `GET /api/stock` endpoint returns current stock levels per product slug
- Product detail page: fetches stock on mount, shows "Out of Stock" (disabled button) or "Only X left" indicator
- Cart page: validates cart quantities against stock, disables checkout when items exceed availability
- Schema.org `availability` on product pages updates dynamically (InStock/OutOfStock)
- Display dashboard: new "Inventory" card showing stock per product

**SEO: structured data, meta tags, sitemap, about page, Merchant Center feed**
- Per-page `<meta name="description">` and Open Graph tags (`og:title`, `og:description`, `og:type`, `og:url`, `og:image`) on all public pages
- Twitter Card tags (`summary_large_image` for products, `summary` for tools)
- JSON-LD structured data: `Product` schema on product pages (with offers, shipping, brand), `ItemList` on store listing, `Organization` + `WebSite` on home page, `AboutPage` on about page
- Canonical URLs via `<link rel="canonical">` on every page (root layout)
- XML sitemap at `/sitemap.xml` with product image tags, submitted to Google Search Console and Bing Webmaster Tools
- Google Merchant Center product feed at `/feeds/products.xml` (RSS 2.0 with `g:` namespace) — includes brand, MPN, category 303 (Keyboards), all product images, free shipping
- Default `<meta name="description">` and `<meta property="og:site_name">` in `app.html`
- About page (`/about`) — rich content page with keyboard build guide, layout explanations (40% and QAZ), what's in the kit, why compact keyboards, tools overview, real photos from `static/images/kb/`, heavy internal cross-linking
- About link added to site footer
- Internal cross-links: product pages → configurator, matrix tester → store/configurator, configurator → store
- Descriptive image alt text on product photos for Google Image search
- WebP image optimization: all product photos and about page photos converted to WebP, served via `<picture>` tags with JPEG fallback (ProductCard, product detail, cart, about page)
- BreadcrumbList JSON-LD on product detail pages (Home > Store > Product Name)
- FAQPage JSON-LD on about page with 5 Q&A pairs (kit contents, soldering, compatibility, firmware, shipping)
- `robots.txt` updated with sitemap reference

**Shipping address collection & kit acknowledgment**
- Stripe Checkout now collects US shipping address (`shipping_address_collection: { allowed_countries: ['US'] }`)
- Webhook extracts `session.shipping_details`, stores in 7 new columns on `orders` table (name, line1, line2, city, state, postal_code, country)
- Shipping address displayed on order detail page, checkout success page, and order confirmation email
- Product detail page: "Add to Cart" disabled until kit acknowledgment checkbox is checked — "This is a kit — I'll provide my own switches and keycaps"

**Checkout security hardening**
- Webhook event deduplication: new `webhook_events` table tracks processed Stripe event IDs, preventing duplicate confirmation emails from webhook replays or concurrent deliveries
- Atomic payment processing: `processPaymentWebhook()` wraps event recording + order status update in a single SQLite transaction, eliminating the race condition where concurrent webhooks both read `status='pending'`
- Payment status validation: webhook now verifies `session.payment_status === 'paid'` before marking orders as paid
- New webhook handlers: `checkout.session.expired` (logged), `charge.dispute.created` (logged as error), `charge.failed` (logged as error), plus audit trail for all unhandled event types
- Stripe secret validation: warns at startup if `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` are missing
- CSP fix: added `https://*.stripe.com` to `connect-src` for future Stripe.js/Elements compatibility
- Structured webhook logging: all warn/error paths include `event.id` and `orderId` context
- Hourly cleanup of webhook events older than 7 days

**Stripe Checkout integration**
- Added Stripe Checkout (hosted) — full page redirect to Stripe's payment page, no card UI to build
- `POST /api/checkout`: creates pending order (reuses existing price validation), builds Stripe Checkout Session with `price_data` line items, returns redirect URL
- `POST /api/webhooks/stripe`: signature-verified webhook handler for `checkout.session.completed` — marks order as paid, stores PaymentIntent ID, sends confirmation email
- Idempotent webhook: skips duplicate deliveries if order already paid
- CSRF bypass for webhook path (authenticated by Stripe signature verification instead)
- DB migration: `stripe_session_id` + `stripe_payment_intent` columns on orders table with index
- Stale pending order cleanup: hourly job deletes pending orders older than 24h (abandoned checkouts)
- Cart page: green "Checkout" button with auth check, loading state, error display
- Success page (`/store/checkout/success`): clears cart, shows confirmation, links to order detail
- Lazy Stripe client init to avoid build-time crash when env var not set

**Brand assets**
- Exported Miami Nights TypeArt logo: transparent PNG, dark background PNG, and SVG
- Courier Prime Bold Italic, per-letter neon colors: cyan `#0AD2D3`, blue `#00D4FF`, violet `#B537F2`, pink `#FF2E97`

**Product photos & image gallery**
- Added real product photos: Type 40 (5 images) and Type QAZ (3 images) in `static/images/products/{slug}/`
- Compressed with ImageMagick (1200×900, quality 82) — originals 1–3MB → 150–230KB each
- Product detail page: main image + thumbnail strip gallery with click-to-switch
- `ProductCard.svelte`: shows first product photo when available, falls back to color placeholder
- Cart page: replaced blank swatch with actual product photo thumbnail
- Added `imageCount` field to `products.txt` format and parser

**Product catalog updates**
- Type 40: corrected to staggered layout (was ortholinear), highlighted rotary encoder + arrow keys, 2mm PORON foam, removed illumination mention
- Color options with pricing: Galaxy Black ($0), Void Purple ($0), Translucent (+$20) — uses `name | price` pipe-delimited format
- Stabilizer options: None ($0), Durock V3 screw-in (+$15)
- Wrist rest price updated to $19 for both products

**Color pricing system**
- New `ColorOption` type (name + price) mirroring existing `StabilizerOption` pattern
- Parser updated: colors use `name | price` format (same as stabilizers)
- Cart store: tracks `colorPrice` per item, included in total calculation
- Product detail page: color selector shows surcharge inline (e.g., "Translucent (+$20.00)")
- Server-side validation: verifies color name exists in catalog and client price matches
- DB migration: added `color_surcharge_cents` column to `order_items` (ALTER TABLE for existing DBs)
- Order detail page and email line totals include color surcharge

**Pricing audit fixes**
- Fixed color price validation gap: server now rejects orders where `colorPrice` doesn't match catalog
- Fixed order confirmation email: line total calculation was missing `color_surcharge_cents`

**Kiosk dashboard display**
- Added `/display` route: full-screen stats dashboard optimized for 7" HDMI display (1024×600)
- Hardcoded Miami Nights theme with neon accent colors — revenue (green), orders (blue), users (violet), typing tests (cyan)
- 4 stat cards with big numbers and "+N today" deltas, recent orders feed with status badges and relative timestamps, period breakdown (today/7d/30d), top products bar chart, avg/top WPM
- Auto-refreshes data every 30s via `invalidateAll()`, live clock updates every second, pulsing green "live" indicator
- Root layout conditionally bypasses navbar/footer for `/display` route
- Systemd service (`typeart-display.service`): cage Wayland compositor + Firefox ESR kiosk mode, starts after typeart.service, enabled on boot

### 2026-02-16

**VIA definition library**
- Configure and matrix tester now support any VIA-compatible keyboard via online fallback to usevia.app (~1,500+ definitions)
- Local VID/PID lookup tried first; on miss, fetches pre-parsed definition from `https://usevia.app/definitions/v3/{vpid}.json` (falls back to v2)
- Converts VIA's pre-built `keys`/`optionKeys` format to TypeArt's `ParsedKey[]` directly, skipping KLE parsing
- Local keyboard registry trimmed to TypeArt original boards only (Lux40v2, Lux36)
- Removed redundant WebHID warning from home page (already shown on configure/test pages)

**Security hardening II**
- Password change endpoint (`POST /api/auth/change-password`): verifies current password, updates hash, invalidates all other sessions, rate limited (5/15min)
- Account deletion endpoint (`POST /api/auth/delete-account`): password-verified, cascading delete of all user data (sessions, scores, orders, reset tokens), rate limited (3/15min)
- Settings page (`/settings`): change password form + two-step account deletion with confirmation
- CSRF protection: Origin header checking in `hooks.server.ts` for all POST/PUT/DELETE requests — rejects cross-origin requests with 403
- Leaderboard query param validation: `mode` and `param` validated against allowed values before SQL query
- Nginx request body size limit: `client_max_body_size 1M` prevents DoS via large payloads
- Max 5 concurrent sessions per user: oldest sessions pruned on new login
- Account lockout: 5 failed login attempts = 15min lock, 10 failures = 1hr lock, clears on successful login
- Security event logging: `security_logs` table recording login success/failure, account lockouts, registrations, password changes/resets, account deletions with IP and timestamp

**Security hardening**
- Server-side price validation: orders now validate slug, color, stabilizer, and wrist rest prices against the product catalog (`static/products.txt`) — client-submitted prices are ignored
- Security headers on all responses (hooks.server.ts + nginx): CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, HSTS
- Login timing attack fix: always runs Argon2 verify (dummy hash for non-existent users) so response time doesn't leak whether an account exists
- Generic registration error message ("Username or email is already in use") to prevent account enumeration
- Session tokens upgraded from UUID to `randomBytes(32).toString('hex')`
- Rate limiting moved from in-memory Map to SQLite (persists across restarts)
- Score validation: WPM cap lowered to 250, raw_wpm cap 300, cross-field consistency checks (WPM vs chars/time), raw_wpm must be >= wpm
- Cookie `secure` flag always true (was conditional on NODE_ENV)
- Database file permissions hardened (chmod 600/700)

**Email service**
- Added Resend integration (`src/lib/server/email.ts`) for transactional emails
- Forgot password flow: `/forgot-password` → email with tokenized reset link → `/reset-password` with token validation
- Order confirmation emails sent on checkout

**UX improvements**
- Per-page `<title>` tags on all routes (Configure, Matrix Test, Typing Test, Store, Cart, Orders, etc.)
- Custom 404/error page (`+error.svelte`) with large monospace status code and back-to-home link
- Site footer on all pages: copyright, Privacy Policy, Terms of Service, Contact (mailto)
- Privacy policy (`/privacy`) and Terms of Service (`/terms`) pages
- Personal stats (bests + recent scores) as inline panel on typing test page, toggled from mode bar between "quote" and "leaderboard"
- Mobile responsive navigation: hamburger menu with animated open/close below 640px, mobile cart badge always visible, responsive footer stacking

**Theme & UI**
- Default theme changed to Miami Nights (was Retro Beige)
- Theme button border now matches active theme: rainbow gradient for Retro Beige, gold/red/blue for Godspeed, cyan/violet/pink for Miami Nights
- Home page: removed Asteroid Run tile, Store now half-width, 2×2 grid (Store · Configure · Typing Test · Matrix Test)
- Fixed card content shift on hover in Retro Beige and Godspeed (border-width now constant, only color changes on hover)

**Infrastructure**
- Graceful shutdown: `db.close()` on SIGTERM/SIGINT/sveltekit:shutdown prevents slow WAL checkpoint on exit
- `SHUTDOWN_TIMEOUT=3` (adapter-node) + `TimeoutStopSec=10` (systemd) — restart went from ~90s to <1s

### 2026-02-15

**Favicon**
- Added SVG browser tab icon: "TA" in Courier New italic, stroke-width 1.33, T in cyan (`#0AD2D3`), A in pink (`#FF2E97`) from Miami Nights theme
- Referenced in `app.html` via `<link rel="icon" type="image/svg+xml">`

**Typing test**
- Added leaderboard toggle button to the mode settings bar (`time words quote | leaderboard | 15 30 60`)
- Clicking shows current mode's top 10 leaderboard inline; dismissed on mode change, option change, or reset

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
- Added switchable colorways: Retro Beige, Miami Nights, and Godspeed
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
- Home page: 2×2 nav card grid with rainbow gradient border on hover with rounded corners
- Linux udev rules file (`static/99-typeart.rules`) for HID device permissions
