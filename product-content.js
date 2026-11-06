/* Shared allowlist for administrator-authored product detail content. */
(function () {
  const allowed = new Set(['P','DIV','BR','H2','H3','STRONG','B','EM','I','U','S','STRIKE','UL','OL','LI','BLOCKQUOTE','A','IMG','IFRAME','VIDEO']);
  function url(value, image = false) {
    if (image && /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(value)) return value;
    try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
  }
  function video(value) {
    const safe = url(value); if (!safe) return null;
    const u = new URL(safe), host = u.hostname;
    let id;
    if (host === 'youtu.be') id = u.pathname.slice(1);
    if (['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(host)) {
      id = u.searchParams.get('v') || u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    }
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return {tag:'iframe',src:'https://www.youtube-nocookie.com/embed/'+id};
    if (['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)) {
      id = u.pathname.match(/\/(?:video\/)?(\d+)\/?$/)?.[1];
      if (id) return {tag:'iframe',src:'https://player.vimeo.com/video/'+id};
    }
    if (/\.(mp4|webm)$/i.test(u.pathname)) return {tag:'video',src:safe};
    return null;
  }
  function sanitize(html) {
    const source = document.createElement('template'); source.innerHTML = String(html || '');
    const target = document.createElement('div');
    function walk(node, parent) {
      if (node.nodeType === 3) { parent.append(document.createTextNode(node.textContent)); return; }
      if (node.nodeType !== 1 || ['SCRIPT','STYLE','OBJECT','EMBED','SVG','MATH','FORM','INPUT','BUTTON'].includes(node.tagName)) return;
      if (node.classList.contains('editor-media')) { [...node.childNodes].forEach(n=>walk(n,parent)); return; }
      if (!allowed.has(node.tagName)) { [...node.childNodes].forEach(n=>walk(n,parent)); return; }
      const out = document.createElement(node.tagName.toLowerCase());
      if (node.tagName === 'IMG') {
        const src = url(node.getAttribute('src') || '', true); if (!src) return;
        out.src = src; out.alt = node.getAttribute('alt') || ''; out.loading = 'lazy';
      } else if (['IFRAME','VIDEO'].includes(node.tagName)) {
        const media = video(node.getAttribute('src') || ''); if (!media || media.tag !== node.tagName.toLowerCase()) return;
        out.src = media.src;
        if (media.tag === 'iframe') { out.title = node.getAttribute('title') || '상품 소개 영상'; out.loading = 'lazy'; out.setAttribute('allow','fullscreen; picture-in-picture'); out.setAttribute('allowfullscreen',''); out.setAttribute('referrerpolicy','strict-origin-when-cross-origin'); }
        else { out.controls = true; out.preload = 'metadata'; }
      } else if (node.tagName === 'A') {
        const href = url(node.getAttribute('href') || ''); if (href) { out.href = href; out.target = '_blank'; out.rel = 'noopener noreferrer'; }
      }
      [...node.childNodes].forEach(n=>walk(n,out)); parent.append(out);
    }
    [...source.content.childNodes].forEach(n=>walk(n,target)); return target.innerHTML;
  }
  window.ProductContent = {sanitize, url, video};
})();
