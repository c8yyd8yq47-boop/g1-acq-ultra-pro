# g1-acq

[![Telegram](https://img.shields.io/badge/Telegram-AI_deals_group-26A5E4?logo=telegram&logoColor=white)](https://t.me/muihbb)

> 💬 **AI deals Telegram group**: https://t.me/muihbb — discuss AI discounts and subscription deals

A Google One (iOS) subscribe-entry product-ID mapping module for **Shadowrocket**.

On the `one.google.com/ai` subscribe page response, it replaces the original monthly iOS IAP IDs for the 20TB and 30TB tiers with promo-tier IDs that actually exist in the catalog, so the subscribe panel launches App Store checkout on the promo offer.

> It only rewrites product ID **strings** in the response text. Whether you can complete the order, and the final price / benefits, are determined by the **App Store checkout sheet** and the actual state of your Google One account.

---

## Module URL (this is the only URL you need on the phone)

```
https://cdn.jsdelivr.net/gh/crhywun/g1-acq@main/g1-acq.sgmodule
```

Script URL (already referenced inside the module — no need to add separately):

```
https://cdn.jsdelivr.net/gh/crhywun/g1-acq@main/g1-acq.js
```

## Mapping table

| Original iOS IAP ID | Replace with | Notes |
|---|---|---|
| `g1.ios.20tb.m.v2` | `g1.20tb.3months_ip_90p.acq` | 20TB monthly → promo tier |
| `g1.ios.30tb.ai.pro.m` | `g1.ai.ultra.3months_ip_90p.acq` | 30TB AI Pro monthly → AI Ultra promo tier |

Both promo names must actually appear in the response’s product catalog before the script will replace anything. If the primary (90p) tier is missing from the catalog but the fallback (75p) is present, it automatically falls back:

| Primary (90p) | Fallback (75p) |
|---|---|
| `g1.20tb.3months_ip_90p.acq` | `g1.20tb.3months_ip_75p.acq` |
| `g1.ai.ultra.3months_ip_90p.acq` | `g1.ai.ultra.3months_ip_75p.acq` |

Promo-tier IDs are limited-time offers; names and tiers change with Google’s campaigns. The catalog-detection log lists every promo tier that actually exists in the current response — use that log to add/remove entries in `SKU_MAP`.

## Install (Shadowrocket)

How to open **HTTPS Decryption**: Config tab → tap the **(i)** icon to the right of the config you are using → in the config editor page, find **HTTPS Decryption**.

![Config entry: tap the (i) icon to the right of shadowrocket.conf to open config editing and see HTTPS Decryption](docs-config-entry.png)

1. Keep VPN on on the home screen
2. Settings → **HTTPS Decryption** (MITM) → turn the master switch on → Certificate: generate and install → finish these two steps in iOS:
   - Settings → General → VPN & Device Management → install the Shadowrocket profile
   - Settings → General → About → **Certificate Trust Settings** → enable trust for the Shadowrocket root certificate (skip this and decryption will not work)
3. On the HTTPS Decryption page, confirm the hostname list includes `one.google.com` (the module appends this automatically when enabled; if logs never show `[g1-acq]` and the connection shows as not decrypted, manually add `one.google.com` at the end of the hostname list)
4. Config → Modules → top-right `+` → paste the module URL above → install
5. Confirm the module switch is on, then long-press to reconnect once

## Scope

- URL match: `^https://one\.google\.com/ai\?` (subscribe entry page only; not site-wide)
- MITM (Settings → HTTPS Decryption) hostname: `one.google.com`
- QUIC block: the module’s built-in rule rejects UDP 443 so Google App cannot bypass HTTPS decryption via HTTP/3

## How to use (on the phone)

1. Open the **Google App** (the multicolor G icon) → avatar → **Google One manage**, enter the subscription management page (this is the page whose `/ai` response the module rewrites)
2. In the Ultra plan picker, tap **Subscribe to this plan** on the **20TB** tier; App Store checkout should open at the promo price (~90% off). Same for the 30TB tier.

![Google One Ultra plan picker: tap Subscribe to this plan on the 20TB tier](docs-ultra-plans.png)

> Note: The subscribe page opened from the standalone Google One app uses a native API and is **outside** this module’s rewrite scope. Enter via **Google One manage inside the Google App**.

## Verify & troubleshoot

Go to Data → Log → Proxy, search `g1-acq`:

| Log | Meaning |
|---|---|
| `[g1-acq] v6 loaded` | Script loaded; correct version |
| `目录优惠档: ...` | All promo tiers that actually exist in the response |
| `主档不在目录,降级 ...` | Automatically using the fallback tier |
| `共改写 N 处` | Replacement ran |
| No `g1-acq` at all | Script never fired — check VPN / HTTPS Decryption (certificate install + trust switch) / module switch |

After changing `SKU_MAP`: `git push` locally, then on the phone clear Shadowrocket cache once (Data → Clear All Data) and reconnect to pull the new script. jsDelivr caches for a few minutes; you can purge manually: `https://purge.jsdelivr.net/gh/crhywun/g1-acq@main/g1-acq.js`.

## Permissions & security boundary

- **Traffic visibility**: The script only matches HTTP responses for `one.google.com/ai`; it can read and rewrite that page’s response body. It does not read or modify traffic for any other domain.
- **No outbound capability**: The script contains no `$httpClient` or other network calls; all output goes only to the phone’s local logs.
- **MITM scope**: Appends only the hostname `one.google.com`. The CA certificate is generated and kept on the user’s device; the module author cannot obtain it.
- **System permissions**: Requests no iOS permissions (no notification / location / photos prompts). Install actions happen only inside Shadowrocket.
- **Global side effect**: `[Rule]` rejects all UDP 443 (QUIC), which can slow HTTP/3 for all apps. Performance side effect only; no privacy impact.
- **Trust model**: The script URL points at the GitHub repo + jsDelivr CDN. Installing means you trust the repo owner’s future changes to the script (in theory a malicious version could at most obtain cookies and page data for the single domain `one.google.com/ai`; it cannot touch other sites), plus the integrity of GitHub / jsDelivr. The script is open source and auditable. For distribution you can replace `@main` with a specific commit hash to pin an immutable version.

## Files

| File | Purpose |
|---|---|
| `g1-acq.sgmodule` | Shadowrocket module (rules + script reference + MITM) |
| `g1-acq.js` | Response rewrite script (v6) |

## Customization

- Add/remove tiers: only edit the `SKU_MAP` and `FALLBACK` tables at the top of `g1-acq.js`
- Change prices: price-field rewriting is not implemented yet; if needed, after the replace loop add a regex replace on `price_amount_micros`
- The script has no network reporting and no external dependencies
