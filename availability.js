/* Shared helpers for volunteer availability.
   Saved slots are strings in the volunteer's own time zone (av.tz):
     "d-s-e"  day d (0 = Monday ... 6 = Sunday), free from minute s to minute e after midnight (multiples of 15, e up to 1440)
     "d-h"    older format: day d, the whole hour starting at h. Still read correctly. */
window.BTC_AV = (function(){
  const DAYS_EN = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const DAYS_ZH = ['周一','周二','周三','周四','周五','周六','周日'];
  const WK = { Mon:0, Tue:1, Wed:2, Thu:3, Fri:4, Sat:5, Sun:6 };
  const pad = n => String(n).padStart(2, '0');
  const FMT = {};
  function parts(ms, tz){
    const f = FMT[tz] || (FMT[tz] = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', weekday: 'short' }));
    const o = {}; f.formatToParts(new Date(ms)).forEach(p => { o[p.type] = p.value; });
    const h = +o.hour % 24; return { y: +o.year, m: +o.month, d: +o.day, h, mi: +o.minute, min: h * 60 + (+o.minute), dow: WK[o.weekday] };
  }
  /* Wall-clock time in tz -> UTC milliseconds. minutes = minutes after midnight. */
  function wallToUtc(y, m, d, minutes, tz){
    const guess = Date.UTC(y, m - 1, d, 0, minutes);
    let t = guess;
    for (let i = 0; i < 3; i++) { const p = parts(t, tz); t = t - (Date.UTC(p.y, p.m - 1, p.d, 0, p.min) - guess); }
    return t;
  }
  const ymd = (y, m, d) => y + '-' + pad(m) + '-' + pad(d);
  function validTz(tz){ try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch (e) { return false; } }
  /* slots -> merged [{d,s,e}] */
  function toRanges(slots){
    const r = [];
    (slots || []).forEach(x => {
      const a = String(x).split('-').map(Number);
      if (a.length === 2) r.push({ d: a[0], s: a[1] * 60, e: a[1] * 60 + 60 });
      else if (a.length === 3 && a[2] > a[1]) r.push({ d: a[0], s: a[1], e: a[2] });
    });
    return merge(r);
  }
  function merge(r){
    const out = []; r.slice().sort((a, b) => a.d - b.d || a.s - b.s).forEach(x => {
      const l = out[out.length - 1]; if (l && l.d === x.d && x.s <= l.e) l.e = Math.max(l.e, x.e); else out.push({ d: x.d, s: x.s, e: x.e });
    }); return out;
  }
  const fromRanges = r => r.map(x => x.d + '-' + x.s + '-' + x.e);
  function hasSlots(av){ return !!(av && av.tz && av.slots && av.slots.length && validTz(av.tz)); }
  /* The weekly ranges expressed in Beijing time, using the current week. Returns {0..6: [{s,e}]} */
  function inBeijing(av){
    const out = {0:[],1:[],2:[],3:[],4:[],5:[],6:[]};
    if (!hasSlots(av)) return out;
    const now = parts(Date.now(), av.tz);
    const monday = Date.UTC(now.y, now.m - 1, now.d - now.dow);
    toRanges(av.slots).forEach(r => {
      const dt = new Date(monday + r.d * 864e5);
      const u = wallToUtc(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), r.s, av.tz);
      const b = parts(u, 'Asia/Shanghai'), len = r.e - r.s;
      if (b.min + len <= 1440) out[b.dow].push({ s: b.min, e: b.min + len });
      else { out[b.dow].push({ s: b.min, e: 1440 }); out[(b.dow + 1) % 7].push({ s: 0, e: b.min + len - 1440 }); }
    });
    for (let d = 0; d < 7; d++) out[d] = merge(out[d].map(x => ({ d: 0, s: x.s, e: x.e }))).map(x => ({ s: x.s, e: x.e }));
    return out;
  }
  /* Students can only be taught between 08:00 and 23:00 Beijing time (awake hours). */
  const BJ_FROM = 8 * 60, BJ_TO = 23 * 60;
  /* Minutes to add to a wall-clock time in tz on the given weekday (0 = Monday, this week) to get Beijing time. */
  function bjDelta(tz, dow){
    const now = parts(Date.now(), tz), dt = new Date(Date.UTC(now.y, now.m - 1, now.d - now.dow + dow));
    const y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate();
    const b = parts(wallToUtc(y, m, d, 720, tz), 'Asia/Shanghai');
    return (Date.UTC(b.y, b.m - 1, b.d, 0, b.min) - Date.UTC(y, m - 1, d, 0, 720)) / 60000;
  }
  /* For each weekday in the volunteer's tz, the [{s,e}] stretches that fall inside 08:00-23:00 Beijing time. */
  function allowedSegments(tz){
    const out = [];
    for (let d = 0; d < 7; d++) {
      const delta = bjDelta(tz, d), segs = [];
      for (let t = 0; t < 1440; t += 15) { const b = (((t + delta) % 1440) + 1440) % 1440; if (b >= BJ_FROM && b < BJ_TO) { const l = segs[segs.length - 1]; if (l && l.e === t) l.e = t + 15; else segs.push({ s: t, e: t + 15 }); } }
      out.push(segs);
    }
    return out;
  }
  /* Cut ranges down to the allowed stretches. */
  function clipRanges(ranges, allowed){
    const out = [];
    ranges.forEach(r => (allowed[r.d] || []).forEach(a => { const s = Math.max(r.s, a.s), e = Math.min(r.e, a.e); if (e > s) out.push({ d: r.d, s, e }); }));
    return merge(out);
  }
  const hhmm = m => pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60);
  /* [{day, times}] in Beijing time. lang 'zh' or 'en'. */
  function summary(av, lang){
    const bj = inBeijing(av), names = lang === 'zh' ? DAYS_ZH : DAYS_EN, lines = [];
    for (let d = 0; d < 7; d++) if (bj[d].length) lines.push({ day: names[d], times: bj[d].map(x => hhmm(x.s) + '–' + (x.e === 1440 ? '24:00' : hhmm(x.e))).join(lang === 'zh' ? '，' : ', ') });
    return lines;
  }
  function dayOffSet(av){ const s = new Set(); ((av && av.days_off) || []).forEach(x => s.add(typeof x === 'string' ? x : x.day)); return s; }
  /* Does a 30-minute lesson starting at ms fit inside the volunteer's free ranges? Returns {known, ok, reason} */
  function check(av, ms, lessonMin){
    if (!av || !av.tz || !validTz(av.tz)) return { known: false, ok: true };
    const len = lessonMin || 30, bj = parts(ms, 'Asia/Shanghai');
    if (bj.min < BJ_FROM || bj.min + len > BJ_TO) return { known: true, ok: false, reason: 'bj' };
    const p = parts(ms, av.tz);
    if (dayOffSet(av).has(ymd(p.y, p.m, p.d))) return { known: true, ok: false, reason: 'dayoff' };
    if (!hasSlots(av)) return { known: false, ok: true };
    return toRanges(av.slots).some(r => r.d === p.dow && p.min >= r.s && p.min + len <= r.e) ? { known: true, ok: true } : { known: true, ok: false, reason: 'slot' };
  }
  /* Upcoming lesson start times (every 30 min inside a free range) for the next `days` days. */
  function upcoming(av, days, limit){
    if (!hasSlots(av)) return [];
    const now = parts(Date.now(), av.tz), off = dayOffSet(av), rs = toRanges(av.slots), out = [];
    for (let i = 0; i <= days; i++) {
      const dt = new Date(Date.UTC(now.y, now.m - 1, now.d + i)), y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate();
      if (off.has(ymd(y, m, d))) continue;
      const dow = (dt.getUTCDay() + 6) % 7;
      rs.forEach(r => { if (r.d !== dow) return; for (let t = Math.ceil(r.s / 30) * 30; t + 30 <= r.e; t += 30) { const u = wallToUtc(y, m, d, t, av.tz); { const bj = parts(u, 'Asia/Shanghai'); if (u > Date.now() + 36e5 && bj.min >= BJ_FROM && bj.min + 30 <= BJ_TO) out.push(u); } } });
    }
    out.sort((a, b) => a - b); return out.slice(0, limit || 40);
  }
  return { BJ_FROM, BJ_TO, bjDelta, allowedSegments, clipRanges, DAYS_EN, DAYS_ZH, parts, wallToUtc, validTz, hasSlots, toRanges, fromRanges, merge, inBeijing, summary, check, upcoming, dayOffSet, ymd, hhmm };
})();
