// Vercel Web Analytics without npm. Query strings are removed first, so lobby codes (?lobby=) are never sent.
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
window.va('beforeSend', event => {
  const url = new URL(event.url);
  url.search = '';
  return { ...event, url: url.toString() };
});
(() => {
  const s = document.createElement('script');
  s.defer = true;
  s.src = '/_vercel/insights/script.js';
  document.head.appendChild(s);
})();
