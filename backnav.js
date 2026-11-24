/* Adds a "Back to dashboard" button, fixed at the top left, to pages reached from a dashboard. Students go to the student dashboard, everyone else to the volunteer dashboard. */
(function(){
  var student = /student-/.test(location.pathname);
  var a = document.createElement('a');
  a.href = student ? 'student-dashboard.html' : 'volunteer-dashboard.html';
  a.textContent = student ? '← 返回我的主页' : '← Back to dashboard';
  a.className = 'btc-backnav';
  var st = document.createElement('style');
  st.textContent = '.btc-backnav{position:fixed;bottom:16px;left:16px;z-index:9999;background:#1e4e8c;color:#fff;text-decoration:none;font:700 13px/1 system-ui,-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;padding:9px 16px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.25)}.btc-backnav:hover{background:#163c6c}@media print{.btc-backnav{display:none}}';
  document.head.appendChild(st);
  document.body.appendChild(a);
})();
