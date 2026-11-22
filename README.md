# g1-acq-ultra-pro

Shadowrocket / Surge module that rewrites product IDs on Google One’s iOS subscribe page (`one.google.com/ai`).

It replaces the normal monthly Ultra / Pro iOS IAP IDs with promo `*.acq` SKUs when those promos exist in the page catalog, so App Store checkout opens on the discounted offer.

> This only does a **string replace** in the HTTP response body. Whether checkout succeeds, and the final price / benefits, is decided by the **App Store sheet** and your Google / Apple accounts — always trust the Face ID / App Store panel, not the web UI prices.

Fork of [crhywun/g1-acq](https://github.com/crhywun/g1-acq) v6, with Pro mappings and extra logging added.

---

## Module URL (install this one)

```
https://cdn.jsdelivr.net/gh/c8yyd8yq47-boop/g1-acq-ultra-pro@main/g1-acq-ultra-pro.sgmodule
```

Script (already referenced by the module — you do not add it separately):

```
https://cdn.jsdelivr.net/gh/c8yyd8yq47-boop/g1-acq-ultra-pro@main/g1-acq-ultra-pro.js
```

Repo: https://github.com/c8yyd8yq47-boop/g1-acq-ultra-pro

---

## SKU map

| Original iOS IAP ID | Replaced with | Notes |
|---|---|---|
| `g1.ios.20tb.m.v2` | `g1.20tb.3months_ip_90p.acq` | Ultra 20TB monthly → ~90% intro |
| `g1.ios.30tb.ai.pro.m` | `g1.ai.ultra.3months_ip_90p.acq` | Ultra 30TB monthly → ~90% intro |
| `g1.ios.ai.2tb.m` | `g1.2tb.ai.3months_ip_90p.acq` | Pro candidate → ₹199-style 90p intro |
| `g1.ios.ai.2tb.m.v2` | `g1.2tb.ai.3months_ip_90p.acq` | Pro candidate |
| `g1.ios.2tb.ai.m` | `g1.2tb.ai.3months_ip_90p.acq` | Pro candidate |
| `g1.ios.ai.pro.m` | `g1.2tb.ai.3months_ip_90p.acq` | Pro candidate |

Rewrite runs **only if** the target `*.acq` string appears in the `/ai` response catalog. If the 90p SKU is missing but a 75p fallback exists, it uses the fallback:

| Primary (90p) | Fallback (75p) |
|---|---|
| `g1.20tb.3months_ip_90p.acq` | `g1.20tb.3months_ip_75p.acq` |
| `g1.ai.ultra.3months_ip_90p.acq` | `g1.ai.ultra.3months_ip_75p.acq` |
| `g1.2tb.ai.3months_ip_90p.acq` | `g1.2tb.ai.3months_ip_75p.acq` |

Promo SKU names change over time. Use the log line `目录优惠档` / catalog list to see what your account actually gets.

---

## Shadowrocket install

### 1. HTTPS decryption (MitM) — once per device

1. Open **Shadowrocket**
2. Bottom tab **Config** (配置)
3. Find the config with the **blue checkmark** (active config)
4. Tap the **ⓘ** on the **right** of that row (not the config name, not Settings)
5. Open **HTTPS Decryption** (HTTPS 解密)
6. Turn the master switch **ON**
7. **Certificate** → **Generate new CA certificate** → **Install certificate** → Allow
8. iPhone **Settings**:
   - Top may show **Profile Downloaded** → Install  
   - Or **General → VPN & Device Management** → install **Shadowrocket** profile
9. **Settings → General → About → Certificate Trust Settings**
   - Enable **full trust** for **Shadowrocket** (Surge’s entry is separate — you need Shadowrocket’s too)
10. Back in HTTPS Decryption → hostname list includes:

```
one.google.com
```

(The module also appends this automatically. Add it manually if decrypt still fails.)

11. Home: VPN **ON**. Turn **Surge OFF** so it doesn’t steal the VPN.

### 2. Install the module

1. Config → **Modules** (模块) → **+**
2. Paste:

```
https://cdn.jsdelivr.net/gh/c8yyd8yq47-boop/g1-acq-ultra-pro@main/g1-acq-ultra-pro.sgmodule
```

3. Install → module switch **ON**
4. Long-press your node → **Reconnect** (or toggle VPN off/on)

The module also rejects **UDP 443** (QUIC) so Google App traffic can be decrypted. That rule is required.

### 3. Open the correct subscribe page

1. **Force-quit** Google App (app switcher → swipe away). Cached pages skip the script.
2. Open **Google App** (multicolor G) — not the standalone Google One app
3. Avatar → **Google One manage**
4. Open the Ultra / Pro plan list with Subscribe buttons

Standalone Google One uses a native API and is **outside** this module’s rewrite scope.

### 4. Confirm purchase carefully

Tap Subscribe → check the **App Store / Face ID** sheet for product name, price, and billing period. Confirm only if those match what you want. Cancel if full price or wrong product. Web UI prices can lie; the App Store sheet is authoritative.

---

## How to check that it’s working

### A. Request list (what you usually see)

**Data →** request / URL list (tappable URLs):

1. Force-quit Google App → open Google One manage again
2. Look for **`one.google.com`**

| Result | Meaning |
|---|---|
| Never appears | Traffic not through Shadowrocket (VPN off, Surge on, wrong routing) |
| Appears | Proxy path OK — next check MitM / module |
| Path includes `/ai` | Correct page hit |

### B. Script text log (optional)

**Data → Log → Proxy** — search:

```
g1-acq
```

| Log | Meaning |
|---|---|
| `v6-ultra-pro.1 loaded` | Custom script loaded |
| `ios productIds: …` | Every `g1.ios.*` id on the page |
| `目录优惠档: …` | Every `*.acq` promo in the catalog |
| `共改写 N 处` | Rewrite succeeded |
| `跳过 …（目标不在目录）` | Target promo not in catalog |
| `未命中` | None of the FROM ids appeared |
| No `g1-acq` at all | Script never ran — MitM / module / cache / wrong app |

Many Shadowrocket builds show the request list more clearly than script console lines. Prefer check **A** first.

---

## Scope

- URL match: `^https://one\.google\.com/ai\?` (subscribe entry only)
- MitM hostname: `one.google.com`
- QUIC block: UDP 443 reject so Google App doesn’t bypass decrypt via HTTP/3

---

## Troubleshooting

| Problem | Fix |
|---|---|
| No Shadowrocket in Certificate Trust Settings | You only installed Surge’s CA. Generate + install Shadowrocket CA (§1) |
| No `one.google.com` in request list | VPN off, Surge still on, or Google App not using proxy |
| `one.google.com` appears but no rewrite | HTTPS decrypt OFF, cert not trusted, module OFF, or Google App not force-quit |
| Script loaded but `跳过` / `未命中` | Account/region catalog missing those SKUs — paste `ios productIds` + catalog log lines |
| App Store says unavailable / wrong tier | Target `*.acq` not valid for this Apple ID region — cancel |
| Still full price on Face ID sheet | Button uses an unmapped FROM id — send logs to extend `SKU_MAP` |

Smoke test with stock Ultra-only module (community baseline):

```
https://cdn.jsdelivr.net/gh/crhywun/g1-acq@main/g1-acq.sgmodule
```

If stock also does nothing, the break is MitM / entry path, not this script.

---

## Security / trust

- Script only matches `one.google.com/ai` responses; it does not call the network (`$httpClient` / fetch / webhooks: none)
- MitM CA is generated on **your** phone
- Module is served from this GitHub repo via jsDelivr — installing means you trust future commits on `main`. Pin a commit hash in the URL if you want an immutable version
- Side effect: UDP 443 reject can slow HTTP/3 for other apps while the module is on

---

## Files

| File | Purpose |
|---|---|
| `g1-acq-ultra-pro.sgmodule` | Shadowrocket / Surge module (rule + script + MitM) |
| `g1-acq-ultra-pro.js` | Response rewrite script (`v6-ultra-pro.1`) |
| `README.md` | This guide |

## Turn off later

1. Modules → turn **G1 ACQ Ultra+Pro** OFF (or delete)
2. Reconnect
3. Optional: HTTPS Decryption OFF if you don’t need MitM elsewhere
4. Manage billing: iPhone **Settings → Apple ID → Subscriptions**
