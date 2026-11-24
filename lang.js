/* Bridge to China — language layer for the student pages.
   Student pages are written as "English · 中文" pairs. In Chinese mode this script removes the English
   and keeps only the Chinese, so students read a fully Chinese page. Strings that exist only in English
   (error messages, etc.) are translated with the DICT / RULES tables below. Nothing is machine-translated at runtime. */
(function () {
  var qs = new URLSearchParams(location.search), stored = null;
  try { stored = localStorage.getItem('btc_lang'); } catch (e) {}
  var param = qs.get('lang');
  if (param === 'zh' || param === 'en') { try { localStorage.setItem('btc_lang', param); } catch (e) {} }
  var pref = (param === 'zh' || param === 'en') ? param : null;
  var CJK = /[㐀-鿿＀-￯　-〿]/;
  var KEEP = ['Bridge to China', 'VooV Meeting', 'VooV', 'GMT+8', 'WeChat', 'QQ'];
  var DICT = window.BTC_DICT = {
    'Please log in.': '请先登录。',
    'Messaging is not set up yet.': '消息功能暂未开通。',
    'Could not load messages.': '无法加载消息。',
    'No messages yet.': '还没有消息。',
    'Write a message…': '输入消息…',
    'Send': '发送',
    'Messages must be 1 to 1000 characters.': '消息长度需在 1 到 1000 个字符之间。',
    'You can only message your active match.': '你只能给当前匹配的志愿者发消息。',
    'You are sending messages too quickly. Please wait a while.': '发送太频繁了，请稍等一会儿再试。',
    'For safety, please do not share emails, phone numbers, links or other contact details here.': '为了安全，请不要在这里分享邮箱、电话号码、链接或其他联系方式。',
    'One moment…': '请稍候…',
    'Homework not found.': '找不到这份作业。',
    'Answers must be 1 to 5000 characters.': '答案长度需在 1 到 5000 个字符之间。',
    'Unknown error': '未知错误'
  };
  var RULES = window.BTC_RULES = [
    [/^Invalid login credentials$/i, '邮箱或密码不正确。'],
    [/^Email not confirmed$/i, '你的邮箱还没有验证，请先点击验证邮件中的链接。'],
    [/^User already registered$/i, '这个邮箱已经注册过了，请直接登录。'],
    [/^Password should be at least (\d+) characters.*$/i, '密码至少需要 $1 个字符。'],
    [/rate limit|too many requests|security purposes/i, '操作太频繁了，请稍等一会儿再试。'],
    [/failed to fetch|networkerror|network request failed|load failed/i, '网络连接失败，请检查网络后重试。'],
    [/^Could not save: (.*)$/i, '无法保存：$1']
  ];
  var zh = pref ? pref === 'zh' : (window.BTC_ZH_DEFAULT !== undefined ? !!window.BTC_ZH_DEFAULT : stored === 'zh');
  if (window.BTC_ZH_DEFAULT === true && !pref) zh = true;   // student pages: Chinese unless ?lang=en
  window.BTC_ZH = zh;
  var busy = false, hasLatin = /[A-Za-z]{2,}/;

  function protect(s) {
    var held = [];
    s = s.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, function (m) { held.push(m); return '\u0001' + (held.length - 1) + '\u0002'; });
    KEEP.forEach(function (k) { s = s.split(k).join(function () { held.push(k); return '\u0001' + (held.length - 1) + '\u0002'; }()); });
    return { s: s, held: held };
  }
  function restore(s, held) { return s.replace(/\u0001(\d+)\u0002/g, function (_, i) { return held[+i]; }); }

  function toZh(text) {
    if (text == null) return text;
    var t = String(text);
    if (DICT[t.trim()]) return t.replace(t.trim(), DICT[t.trim()]);
    for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(t.trim())) return t.trim().replace(RULES[i][0], RULES[i][1]);
    if (!CJK.test(t) || !hasLatin.test(t)) return t;
    var p = protect(t), s = p.s;
    s = s.replace(/\b(?:e\.g\.|optional|or)\b\.?/gi, ' ');
    s = s.replace(/[A-Za-z][A-Za-z0-9'’\/+&%.\-]*(?:[ ,;:!?()'’\/&\-][A-Za-z0-9'’\/+&%.\-]+)*[.!?]?/g, ' ');
    s = restore(s, p.held);
    s = s.replace(/\s*[·•]\s*/g, ' · ').replace(/\(\s*/g, '(').replace(/\s*\)/g, ')').replace(/（\s+/g, '（').replace(/\s+）/g, '）');
    s = s.replace(/(?:\s*[·—–-]\s*){2,}/g, ' · ').replace(/^\s*[·—–-]\s*/, '').replace(/\s*[·—–-]\s*$/, '');
    s = s.replace(/\(\s*\)|（\s*）/g, '').replace(/^[\s,;:.·，]+/, '').replace(/[\s,;:]+$/, '').replace(/\s{2,}/g, ' ');
    var lead = /^\s/.test(t) ? ' ' : '', trail = /\s$/.test(t) ? ' ' : '';
    return lead + s.trim() + trail;
  }

  function procText(n) {
    if (n.__z !== undefined && n.nodeValue === n.__z) { if (!zh) { n.nodeValue = n.__o; n.__z = undefined; } return; }
    if (n.__z !== undefined && n.nodeValue !== n.__z) { n.__z = undefined; n.__o = undefined; }
    if (!zh) return;
    var v = n.nodeValue; if (!v || !v.trim()) return;
    var p = n.parentNode; if (!p || /^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName)) return;
    if (p.nodeType === 1 && p.closest && p.closest('[data-keep-en]')) return;
    var out = toZh(v);
    if (out === v && p.nodeType === 1 && !CJK.test(v) && (hasLatin.test(v) || /^[\s.,;:!?]+$/.test(v)) && !p.closest('[data-keep-en]')) {
      // English-only text sitting beside Chinese in the same element: drop the English
      for (var c = p.firstChild; c; c = c.nextSibling) {
        if (c !== n && ((c.nodeType === 1 && CJK.test(c.textContent) && !/^(INPUT|SELECT|TEXTAREA)$/.test(c.nodeName)) || (c.nodeType === 3 && CJK.test(c.nodeValue)))) { out = ''; break; }
      }
    }
    if (out !== v) { n.__o = v; n.__z = out; n.nodeValue = out; }
  }
  var ATTRS = ['placeholder', 'title', 'aria-label', 'value'];
  function procAttrs(el) {
    if (el.nodeType !== 1) return;
    ATTRS.forEach(function (a) {
      if (a === 'value' && !(el.nodeName === 'INPUT' && /^(button|submit)$/.test(el.type))) return;
      var k = 'data-o-' + a, cur = el.getAttribute(a);
      if (cur == null) return;
      if (el.hasAttribute(k) && !zh) { el.setAttribute(a, el.getAttribute(k)); el.removeAttribute(k); return; }
      if (!zh || el.hasAttribute(k)) return;
      var out = toZh(cur); if (out !== cur) { el.setAttribute(k, cur); el.setAttribute(a, out); }
    });
  }
  function walk(root) {
    if (root.nodeType === 3) { procText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    if (root.nodeType === 1) procAttrs(root);
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null), n;
    var list = []; while ((n = tw.nextNode())) list.push(n);
    list.forEach(function (x) { if (x.nodeType === 3) procText(x); else procAttrs(x); });
  }
  function run(root) {
    if (busy) return; busy = true;
    try { walk(root || document.documentElement); } finally { busy = false; }
    document.documentElement.classList.toggle('zhmode', zh);
    if (zh) document.documentElement.lang = 'zh-CN';
  }
  var mo = new MutationObserver(function (muts) {
    if (busy) return;
    busy = true;
    try {
      muts.forEach(function (m) {
        if (m.type === 'childList') m.addedNodes.forEach(function (a) { busy = false; walk(a); busy = true; });
        else if (m.type === 'characterData') procText(m.target);
        else if (m.type === 'attributes') procAttrs(m.target);
      });
    } finally { busy = false; }
  });
  function start() {
    var st = document.createElement('style');
    st.textContent = 'html.zhmode .zh{display:inline!important;font-size:inherit!important;margin:0!important;color:inherit!important;font-weight:inherit!important}' +
      '#btcLangBtn{position:fixed;right:12px;bottom:12px;z-index:9999;background:#fff;border:1.5px solid #cbd5e1;border-radius:999px;padding:6px 14px;font:600 13px/1 system-ui,sans-serif;color:#334155;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.12)}';
    document.head.appendChild(st);
    run(document.documentElement);
    mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
  }
  window.BTC = {
    isZh: function () { return zh; },
    setZh: function (v) { zh = !!v; window.BTC_ZH = zh; run(document.documentElement); },
    t: function (s) { return zh ? toZh(s) : s; }
  };
  var _alert = window.alert, _confirm = window.confirm;
  window.alert = function (m) { return _alert.call(window, zh ? toZh(m) : m); };
  window.confirm = function (m) { return _confirm.call(window, zh ? toZh(m) : m); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
