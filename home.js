// Home page only.
(function(){
  const desktop=document.getElementById('homeBannerImage');
  const mobile=document.getElementById('homeBannerMobileSource');
  if(!desktop||!mobile)return;
  function render(){
    let banner={};
    try{banner=JSON.parse(localStorage.getItem('goodsHomeBanner')||'{}')||{};}catch{}
    if(banner.desktop){desktop.src=banner.desktop;desktop.removeAttribute('srcset');}
    else{desktop.src='assets/home-hero-default.png?v=4';desktop.srcset='assets/home-hero-default.png?v=4 1x, assets/home-hero-default@2x.png?v=1 2x';}
    mobile.srcset=banner.mobile||'assets/home-hero-mobile-default.png?v=2 1x, assets/home-hero-mobile-default@2x.png?v=1 2x';
  }
  render();
  window.addEventListener('storage',event=>{if(event.key==='goodsHomeBanner')render();});
})();
