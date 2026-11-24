/* Week calendar editor for volunteer availability (drag to add time, drag to move, drag the edges to resize, zoom in for 15-minute precision). */
window.BTC_AV_EDIT = (function(){
  const LEVELS = [36, 60, 90, 130];   // pixels per hour
  const esc = t => String(t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = m => { const h = Math.floor(m / 60) % 24, mi = m % 60, ap = (h < 12 || m === 1440) ? 'AM' : 'PM'; return ((h % 12) || 12) + (mi ? ':' + String(mi).padStart(2, '0') : ':00') + ' ' + ap; };
  const CSS = `
  .cal-tools{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:8px;font-size:.82rem;color:var(--ink-soft);}
  .cal-tools button,.cal-tools select{padding:6px 12px;border:1.5px solid var(--line);border-radius:999px;background:#fff;font-weight:700;font-size:.8rem;cursor:pointer;font-family:inherit;}
  .cal-wrap{overflow:auto;height:min(78vh,820px);min-height:560px;border:1px solid var(--line);border-radius:12px;background:#fff;position:relative;}
  .cal-inner{min-width:720px;}.cal-head div{font-size:.9rem !important;}
  .cal-head{display:grid;grid-template-columns:84px repeat(7,1fr);position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid var(--line);}
  .cal-head div{padding:8px 4px;text-align:center;font-weight:700;font-size:.8rem;}
  .cal-body{display:grid;grid-template-columns:84px repeat(7,1fr);}
  .cal-gut{position:relative;}
  .cal-gut span{position:absolute;right:8px;font-size:.7rem;color:var(--ink-soft);transform:translateY(-50%);white-space:nowrap;}
  .cal-off{position:absolute;left:0;right:0;background:repeating-linear-gradient(135deg,#e6e9ec,#e6e9ec 6px,#d9dde1 6px,#d9dde1 12px);pointer-events:none;opacity:.95;}
  .cal-gut small{display:block;color:#8a96a3;font-size:.62rem;}
  .cal-col{position:relative;border-left:1px solid var(--line);cursor:crosshair;touch-action:pan-y;}
  .cal-blk{position:absolute;left:3px;right:3px;background:var(--green);color:#fff;border-radius:8px;font-size:.72rem;font-weight:700;padding:4px 24px 4px 6px;box-sizing:border-box;overflow:hidden;cursor:grab;touch-action:none;box-shadow:0 1px 4px rgba(0,0,0,.2);}
  .cal-blk.preview{opacity:.55;pointer-events:none;}
  .cal-blk .x{position:absolute;top:2px;right:4px;border:none;background:rgba(0,0,0,.25);color:#fff;border-radius:50%;width:18px;height:18px;line-height:16px;font-size:12px;cursor:pointer;padding:0;}
  .cal-blk .rz{position:absolute;left:0;right:0;height:9px;cursor:ns-resize;}
  .cal-blk .rz.t{top:0}.cal-blk .rz.b{bottom:0}
  .cal-blk .rz::after{content:"";position:absolute;left:35%;right:35%;height:3px;border-radius:2px;background:rgba(255,255,255,.7);}
  .cal-blk .rz.t::after{top:2px}.cal-blk .rz.b::after{bottom:2px}
  `;
  function mount(el, opts){
    if (!document.getElementById('cal-css')) { const s = document.createElement('style'); s.id = 'cal-css'; s.textContent = CSS; document.head.appendChild(s); }
    const A = window.BTC_AV, days = A.DAYS_EN;
    const allowed = opts.allowed || [0,1,2,3,4,5,6].map(() => [{ s: 0, e: 1440 }]);
    const delta0 = opts.tz ? A.bjDelta(opts.tz, 0) : null;
    let ranges = A.clipRanges(A.merge(opts.ranges || []), allowed), lvl = 1, drag = null, preview = null, justDragged = false;
    const pph = () => LEVELS[lvl], snap = () => lvl === 0 ? 30 : 15;
    el.innerHTML = `<div class="cal-tools">
        <span>Zoom</span><button type="button" data-z="-1" aria-label="Zoom out">−</button><button type="button" data-z="1" aria-label="Zoom in">+</button>
        <span id="calSnap"></span><span style="flex:1"></span>
        <span>Copy</span><select id="calFrom">${days.map((d, i) => `<option value="${i}">${d}</option>`).join('')}</select>
        <span>to</span><select id="calTo"><option value="wk">Mon–Fri</option><option value="we">Sat–Sun</option><option value="all">every day</option></select>
        <button type="button" id="calCopy">Copy</button></div>
      <div class="cal-wrap" id="calWrap"><div class="cal-inner"><div class="cal-head"><div></div>${days.map(d => `<div>${d}</div>`).join('')}</div><div class="cal-body" id="calBody"></div></div></div>
      <div style="font-size:.8rem;margin-top:8px;color:#b3541e;font-weight:600;min-height:1.2em;" id="calNote"></div>
      <div style="font-size:.78rem;color:var(--ink-soft);margin-top:2px;" id="calTotal"></div>
      <div style="font-size:.78rem;color:var(--ink-soft);margin-top:2px;">Click or drag on a day to add free time. Gray hours are outside 8 AM–11 PM Beijing time, when students are asleep, so they can't be picked. Drag a green block to move it, drag its top or bottom edge to resize, press × to remove. Use + to zoom in for 15-minute precision.</div>`;
    const body = el.querySelector('#calBody'), wrap = el.querySelector('#calWrap');
    function render(){
      const H = pph() * 24, px = m => m / 60 * pph();
      el.querySelector('#calSnap').textContent = 'Snaps to ' + snap() + ' min';
      let g = `<div class="cal-gut" style="height:${H}px">`;
      for (let h = 1; h < 24; h++) {
        let bjl = ''; if (delta0 !== null) { const t = h * 60 + delta0, dd = Math.floor(t / 1440), mm = ((t % 1440) + 1440) % 1440; bjl = `<small>BJ ${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}${dd > 0 ? ' +1' : dd < 0 ? ' −1' : ''}</small>`; }
        g += `<span style="top:${h * pph()}px;text-align:right;line-height:1.15">${fmt(h * 60)}${bjl}</span>`;
      }
      g += '</div>';
      const quarter = pph() >= 90 ? `,repeating-linear-gradient(to bottom,transparent 0,transparent ${pph() / 4 - 1}px,rgba(0,0,0,.04) ${pph() / 4 - 1}px,rgba(0,0,0,.04) ${pph() / 4}px)` : '';
      const bg = `background-image:linear-gradient(to bottom,var(--line) 1px,transparent 1px),linear-gradient(to bottom,rgba(0,0,0,.06) 1px,transparent 1px)${quarter};background-size:100% ${pph()}px,100% ${pph() / 2}px${quarter ? ',auto' : ''};`;
      const all = ranges.concat(preview ? [Object.assign({ pv: true }, preview)] : []);
      let cols = ''; for (let d = 0; d < 7; d++) {
        let offs = '', prev = 0; (allowed[d] || []).concat([{ s: 1440, e: 1440 }]).forEach(a => { if (a.s > prev) offs += `<div class="cal-off" style="top:${px(prev)}px;height:${px(a.s - prev)}px"></div>`; prev = a.e; });
        cols += `<div class="cal-col" data-d="${d}" style="height:${H}px;${bg}">${offs}` + all.map((r, i) => r.d !== d ? '' :
          `<div class="cal-blk${r.pv ? ' preview' : ''}" data-i="${i}" style="top:${px(r.s)}px;height:${Math.max(px(r.e - r.s), 8)}px;">${r.pv ? '' : '<div class="rz t" data-a="t"></div><div class="rz b" data-a="b"></div><button class="x" type="button" aria-label="Remove">×</button>'}${(r.e - r.s) * pph() / 60 >= 26 ? esc(fmt(r.s) + ' – ' + fmt(r.e)) : ''}</div>`).join('') + '</div>';
      }
      body.innerHTML = g + cols;
      const hrs = ranges.reduce((a, r) => a + (r.e - r.s), 0) / 60;
      el.querySelector('#calTotal').textContent = hrs ? 'You are free about ' + (Math.round(hrs * 4) / 4) + ' hours per week.' : 'No free time added yet.';
    }
    const colAt = x => { const cs = body.querySelectorAll('.cal-col'); for (const c of cs) { const r = c.getBoundingClientRect(); if (x >= r.left && x < r.right) return c; } return null; };
    const minAt = (col, y) => (y - col.getBoundingClientRect().top) / pph() * 60;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const note = el.querySelector('#calNote');
    const changed = () => {
      const before = A.merge(ranges), clipped = A.clipRanges(before, allowed);
      const mins = r => r.reduce((a, x) => a + x.e - x.s, 0);
      note.textContent = mins(clipped) < mins(before) ? 'Part of that time was removed: students can only be taught between 8 AM and 11 PM Beijing time (the gray hours).' : '';
      ranges = clipped; render(); if (opts.onChange) opts.onChange(ranges);
    };

    body.addEventListener('click', e => {
      const x = e.target.closest('.x');
      if (x) { ranges.splice(+x.closest('.cal-blk').dataset.i, 1); return changed(); }
      if (justDragged) return;
      if (e.target.classList.contains('cal-col')) {
        const d = +e.target.dataset.d, s = clamp(Math.floor(minAt(e.target, e.clientY) / snap()) * snap(), 0, 1380);
        ranges.push({ d, s, e: Math.min(s + 60, 1440) }); changed();
      }
    });
    body.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('.x')) return;
      const blk = e.target.closest('.cal-blk');
      if (blk) {
        const i = +blk.dataset.i, r = ranges[i], col = blk.parentElement, a = e.target.dataset.a;
        drag = { kind: a === 't' ? 'rt' : a === 'b' ? 'rb' : 'mv', i, d0: r.d, s0: r.s, e0: r.e, off: minAt(col, e.clientY) - r.s };
        e.preventDefault(); return;
      }
      if (e.pointerType === 'touch' || !e.target.classList.contains('cal-col')) return;
      drag = { kind: 'new', d: +e.target.dataset.d, y0: minAt(e.target, e.clientY), moved: false }; e.preventDefault();
    });
    window.addEventListener('pointermove', e => {
      if (!drag) return;
      const sn = snap();
      if (drag.kind === 'new') {
        const col = body.querySelector('.cal-col[data-d="' + drag.d + '"]'), y = minAt(col, e.clientY);
        if (Math.abs(y - drag.y0) > sn / 2) drag.moved = true; if (!drag.moved) return;
        const lo = Math.floor(clamp(Math.min(y, drag.y0), 0, 1440) / sn) * sn; let hi = Math.ceil(clamp(Math.max(y, drag.y0), 0, 1440) / sn) * sn; if (hi <= lo) hi = lo + sn;
        preview = { d: drag.d, s: lo, e: Math.min(hi, 1440) }; render(); return;
      }
      const r = ranges[drag.i]; if (!r) return;
      if (drag.kind === 'mv') {
        const col = colAt(e.clientX) || body.querySelector('.cal-col[data-d="' + r.d + '"]'), len = drag.e0 - drag.s0;
        r.d = +col.dataset.d; r.s = clamp(Math.round((minAt(col, e.clientY) - drag.off) / sn) * sn, 0, 1440 - len); r.e = r.s + len;
      } else {
        const col = body.querySelector('.cal-col[data-d="' + r.d + '"]'), y = Math.round(minAt(col, e.clientY) / sn) * sn;
        if (drag.kind === 'rb') r.e = clamp(y, r.s + sn, 1440); else r.s = clamp(y, 0, r.e - sn);
      }
      render();
    });
    window.addEventListener('pointerup', () => {
      if (!drag) return;
      const was = drag; drag = null;
      justDragged = true; setTimeout(() => { justDragged = false; }, 60);
      if (was.kind === 'new') {
        if (was.moved && preview) ranges.push(preview);
        else { const st = clamp(Math.floor(was.y0 / snap()) * snap(), 0, 1380); ranges.push({ d: was.d, s: st, e: Math.min(st + 60, 1440) }); }
        preview = null; changed(); return;
      }
      changed();
    });
    el.querySelectorAll('[data-z]').forEach(b => b.onclick = () => {
      const mid = (wrap.scrollTop + wrap.clientHeight / 2) / pph(); lvl = clamp(lvl + +b.dataset.z, 0, LEVELS.length - 1); render(); wrap.scrollTop = mid * pph() - wrap.clientHeight / 2;
    });
    el.querySelector('#calCopy').onclick = () => {
      const from = +el.querySelector('#calFrom').value, to = el.querySelector('#calTo').value;
      const targets = [0,1,2,3,4,5,6].filter(d => d !== from && (to === 'all' || (to === 'wk' ? d < 5 : d >= 5)));
      const src = ranges.filter(r => r.d === from);
      ranges = ranges.filter(r => !targets.includes(r.d)).concat(targets.flatMap(d => src.map(r => ({ d, s: r.s, e: r.e })))); changed();
    };
    render(); (function(){ const f = (allowed[0] || [])[0]; wrap.scrollTop = pph() * ((f ? f.s : 420) / 60 - 0.5); })();
    return { getRanges: () => ranges.map(r => ({ d: r.d, s: r.s, e: r.e })), setRanges: r => { ranges = A.merge(r); render(); }, clear: () => { ranges = []; changed(); } };
  }
  return { mount };
})();
