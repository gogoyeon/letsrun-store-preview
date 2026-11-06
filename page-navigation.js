// Shared navigation for independently addressable HTML pages.
const StorePages = {
  route() {
    const file = location.pathname.split('/').pop();
    const id = new URLSearchParams(location.search).get('id') || '';
    return ({'products.html':'products','product.html':'product/'+id,'checkout.html':'checkout','orders.html':'orders','order-detail.html':'orders/'+id,'order-complete.html':'complete/'+id})[file] || location.hash.slice(1) || 'store';
  },
  url(route) {
    const [page, ...parts] = route.replace(/^#/, '').split('/');
    const id = parts.join('/');
    const file = ({store:'index.html',products:'products.html',product:'product.html',checkout:'checkout.html',orders:id?'order-detail.html':'orders.html',complete:'order-complete.html'})[page];
    return file ? file + (id ? '?id='+encodeURIComponent(decodeURIComponent(id)) : '') : null;
  },
  go(route) { const url = this.url(route); if (url) location.assign(url); }
};
if (!location.pathname.split('/').pop().startsWith('admin') && StorePages.url(location.hash) && location.hash) {
  location.replace(StorePages.url(location.hash));
}
// Upgrade links produced by the shared store rendering functions.
function updateStorePageLinks(root=document) {
  root.querySelectorAll('a[href^="#"]').forEach(link => {
    const url=StorePages.url(link.getAttribute('href'));
    if(url) link.setAttribute('href',url);
  });
}
document.addEventListener('DOMContentLoaded',()=>{
  updateStorePageLinks();
  new MutationObserver(()=>updateStorePageLinks()).observe(document.body,{childList:true,subtree:true});
});
