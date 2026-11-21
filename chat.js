/* Simple message box between a matched volunteer and student. Uses get_messages / send_message (QUERY 7). */
function mountChat(el, matchId, client, hint) {
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  el.innerHTML = '<div class="chat-list" style="max-height:260px;overflow-y:auto;background:var(--bg-tint);border-radius:10px;padding:10px;font-size:.88rem;"></div>' +
    '<div class="chat-hint" style="font-size:.76rem;color:var(--ink-soft);margin:6px 0;">' + esc(hint || '') + '</div>' +
    '<div style="display:flex;gap:8px;"><input type="text" class="chat-in" maxlength="1000" placeholder="Write a message…" style="flex:1;padding:9px 12px;border:1.5px solid var(--line);border-radius:9px;font-family:inherit;">' +
    '<button class="chat-send" style="padding:9px 18px;border:none;border-radius:999px;background:var(--blue);color:#fff;font-weight:700;cursor:pointer;">Send</button></div>' +
    '<div class="chat-err" style="color:#a3312a;font-size:.8rem;margin-top:6px;"></div>';
  const list = el.querySelector('.chat-list'), inp = el.querySelector('.chat-in'), err = el.querySelector('.chat-err');
  async function refresh() {
    const { data, error } = await client.rpc('get_messages', { p_match_id: matchId });
    if (error) { list.textContent = /get_messages|function/i.test(error.message || '') ? 'Messaging is not set up yet.' : 'Could not load messages.'; return; }
    const atEnd = list.scrollTop + list.clientHeight >= list.scrollHeight - 20;
    list.innerHTML = (data || []).length ? data.map(m =>
      '<div style="margin-bottom:8px;text-align:' + (m.mine ? 'right' : 'left') + ';"><span style="display:inline-block;max-width:85%;padding:7px 11px;border-radius:12px;background:' + (m.mine ? '#dbeafe' : '#fff') + ';border:1px solid var(--line);text-align:left;white-space:pre-wrap;">' + esc(m.body) +
      '</span><div style="font-size:.7rem;color:var(--ink-soft);">' + esc(new Date(m.created_at).toLocaleString()) + '</div></div>').join('') : '<span style="color:var(--ink-soft);">No messages yet.</span>';
    if (atEnd) list.scrollTop = list.scrollHeight;
  }
  async function send() {
    const body = inp.value.trim(); if (!body) return;
    err.textContent = '';
    const { error } = await client.rpc('send_message', { p_match_id: matchId, p_body: body });
    if (error) { err.textContent = error.message; return; }
    inp.value = ''; await refresh(); list.scrollTop = list.scrollHeight;
  }
  el.querySelector('.chat-send').onclick = send;
  inp.onkeydown = e => { if (e.key === 'Enter') send(); };
  refresh().then(() => { list.scrollTop = list.scrollHeight; });
  setInterval(() => { if (!document.hidden) refresh(); }, 20000);
}
