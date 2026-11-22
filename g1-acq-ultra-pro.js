/**
 * g1-acq-ultra-pro.js — fork of crhywun/g1-acq v6
 *
 * Ultra (stock) + Pro ₹199 / intro mappings.
 * Logs every g1.ios.* productId in the /ai body so you can fix SKU_MAP.
 *
 * Version: v6-ultra-pro.1
 */
"use strict";

console.log("[g1-acq] v6-ultra-pro.1 loaded");

/* 原始 iOS 内购 ID → 目标优惠档 */
var SKU_MAP = {
  /* Ultra 20TB / 30TB → 3-month ~90% intros (stock g1-acq) */
  "g1.ios.20tb.m.v2":     "g1.20tb.3months_ip_90p.acq",
  "g1.ios.30tb.ai.pro.m": "g1.ai.ultra.3months_ip_90p.acq",

  /*
   * Pro / AI Premium monthly → Android-style 3-month 90% intro.
   * Only fires if the target `*.acq` string also appears in the /ai catalog.
   * FROM ids are candidates — check logs for the real Pro monthly id on your account.
   */
  "g1.ios.ai.2tb.m":      "g1.2tb.ai.3months_ip_90p.acq",
  "g1.ios.ai.2tb.m.v2":   "g1.2tb.ai.3months_ip_90p.acq",
  "g1.ios.2tb.ai.m":      "g1.2tb.ai.3months_ip_90p.acq",
  "g1.ios.ai.pro.m":      "g1.2tb.ai.3months_ip_90p.acq"
};

/* 目标档不在目录时的备用档 */
var FALLBACK = {
  "g1.20tb.3months_ip_90p.acq":     "g1.20tb.3months_ip_75p.acq",
  "g1.ai.ultra.3months_ip_90p.acq": "g1.ai.ultra.3months_ip_75p.acq",
  "g1.2tb.ai.3months_ip_90p.acq":   "g1.2tb.ai.3months_ip_75p.acq"
};

function occurrences(s, needle) {
  return needle ? s.split(needle).length - 1 : 0;
}

function uniq(arr) {
  var seen = {}, out = [];
  for (var i = 0; i < arr.length; i++) {
    if (!seen[arr[i]]) { seen[arr[i]] = 1; out.push(arr[i]); }
  }
  return out;
}

function run() {
  var body = $response && $response.body;
  if (typeof body !== "string" || body === "") {
    $done({});
    return;
  }

  /* All iOS-looking product ids (for mapping diagnosis) */
  var iosIds = uniq(body.match(/g1\.ios\.[a-z0-9._]{2,80}/g) || []);
  console.log("[g1-acq] ios productIds (" + iosIds.length + "): " + (iosIds.join(", ") || "无"));

  /* 响应里真实存在的优惠档目录 (*.acq) */
  var catalog = uniq(body.match(/g1\.[a-z0-9._]{2,60}acq/g) || []);
  console.log("[g1-acq] 目录优惠档: " + (catalog.join(", ") || "无"));

  var out = body, total = 0;
  var froms = Object.keys(SKU_MAP);
  for (var k = 0; k < froms.length; k++) {
    var from = froms[k];
    var n = occurrences(out, from);
    if (n === 0) continue;

    var to = SKU_MAP[from];
    if (catalog.indexOf(to) === -1 && FALLBACK[to] && catalog.indexOf(FALLBACK[to]) !== -1) {
      console.log("[g1-acq] 主档不在目录,降级 " + to + " -> " + FALLBACK[to]);
      to = FALLBACK[to];
    }
    if (catalog.indexOf(to) === -1) {
      console.log("[g1-acq] 跳过 " + from + " → " + to + "（目标不在目录）");
      continue;
    }

    out = out.split(from).join(to);
    total += n;
    console.log("[g1-acq] " + from + " -> " + to + " x" + n);
  }

  console.log(total ? "[g1-acq] 共改写 " + total + " 处" : "[g1-acq] 未命中");
  $done(total ? { body: out } : {});
}

run();
