const productPage=document.getElementById("productPage");
function tidyRichContent(root){
  if(!root)return;
  const media='img,iframe,video';
  [...root.querySelectorAll('h2,h3')].forEach(h=>{if(h.querySelector(media))h.replaceWith(...h.childNodes);});
  [...root.querySelectorAll('p,h2,h3')].forEach(el=>{if(!el.textContent.trim()&&!el.querySelector(media))el.remove();});
}
function renderProductPage(id){
  selected=products.find(p=>p.id===id&&!p.deletedAt&&p.status!=='hidden');
  if(!selected){productPage.innerHTML=EmptyStates.html('productMissing');return;}
  const p=selected,available=canBuy(p);
  document.title=p.name+' | 말마프렌즈 온라인 스토어';
  productPage.innerHTML=`<a class="back-link" href="products.html">← 상품 목록</a><div class="product-layout">${productVisual(p,'detail-art')}<div class="purchase-info"><p class="eyebrow">OFFICIAL GOODS</p><h1 tabindex="-1">${escapeText(p.name)}</h1><p class="product-description">${escapeText(p.description||'렛츠런파크 공식 상품')}</p><p class="detail-price">${won(p.price)}</p><dl class="delivery-info"><div><dt>배송비</dt><dd>${won(storeSettings.shippingFee)} · 주문당 고정 배송비</dd></div><div><dt>판매 상태</dt><dd>${available?'판매 중':'품절'}</dd></div></dl><section class="shipping-notice" aria-labelledby="shippingNoticeHeading"><h2 id="shippingNoticeHeading">배송 안내</h2><p>${escapeText(storeSettings.shippingNotice)}</p></section><div class="product-selection-box"><div class="selection-item"><strong class="selection-name">${escapeText(p.name)}</strong><div class="selection-item-bottom"><div class="counter"><button type="button" id="quantityMinus" aria-label="수량 줄이기" disabled>−</button><input id="detailQty" class="quantity-input" type="text" inputmode="numeric" pattern="[0-9]*" aria-label="상품 수량" value="${available?1:0}" ${available?'':'disabled'}><button type="button" id="quantityPlus" aria-label="수량 늘리기" ${!available||p.stock<=1?'disabled':''}>+</button></div><strong id="detailLineTotal" aria-live="polite">${won(available?p.price:0)}</strong></div></div><div class="selection-totals"><strong>총 <span id="detailTotalQty" aria-live="polite">${available?1:0}</span>개</strong><div><span>총 상품 금액</span><strong id="detailTotal" aria-live="polite">${won(available?p.price:0)}</strong></div></div></div><div class="purchase-actions${available?'':' is-sold-out'}">${available?'<button class="outline" id="detailCart">장바구니에 담기</button><button class="primary" id="buyNow">바로 구매</button>':'<button type="button" class="sold-out-button" disabled>품절</button>'}</div></div></div><section class="product-information"><h2>상품 상세정보</h2><div class="product-rich-content">${p.detailHtml?ProductContent.sanitize(p.detailHtml):'<p>'+escapeText(p.description||'렛츠런파크 공식 상품')+'</p>'}</div><h2>배송 안내</h2><p>${escapeText(storeSettings.shippingNotice)}</p><p>배송비는 주문당 ${won(storeSettings.shippingFee)}입니다.</p><h2>취소 안내</h2><p>결제 후 ${storeSettings.cancelHours}시간 이내, 발송 전까지 주문 전체 취소가 가능합니다. 부분 취소·부분 환불은 지원하지 않습니다.</p></section>`;
  tidyRichContent(productPage.querySelector('.product-rich-content'));
  const policyHeading=productPage.querySelector('.product-information > h2:last-of-type'),policyText=productPage.querySelector('.product-information > p:last-child');
  policyHeading.textContent='취소·반품 안내';
  policyText.textContent=`결제 후 ${storeSettings.cancelHours}시간 이내, 운송장 등록 전까지 주문 전체 취소가 가능합니다. 운송장 등록 후 ${storeSettings.returnDays}일 이내에는 주문 전체 반품을 신청할 수 있습니다. 부분 취소·부분 반품은 지원하지 않으며 불량·오배송 등 법정 예외는 고객센터로 문의해 주세요.`;
  document.getElementById('quantityMinus').onclick=()=>detailQty(-1);
  document.getElementById('quantityPlus').onclick=()=>detailQty(1);
  const quantityInput=document.getElementById('detailQty');
  quantityInput.oninput=()=>{const value=Number(quantityInput.value);if(/^\d+$/.test(quantityInput.value)&&Number.isSafeInteger(value)&&value>=1&&value<=selected.stock)updateDetailQuantity(value);};
  quantityInput.onblur=()=>detailQty(0);
  quantityInput.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();detailQty(0);}};
  if(available){
    document.getElementById('detailCart').onclick=addSelected;
    document.getElementById('buyNow').onclick=()=>{detailQty(0);startCheckout([{id:p.id,qty:Number(document.getElementById('detailQty').value)}],'direct');};
  }
}
function normalizeDetailQuantity(raw, stock, previous=1){
 const value=Number(raw);
 if(!/^\d+$/.test(String(raw))||!Number.isSafeInteger(value))return Math.min(stock,Math.max(1,previous));
 return Math.min(stock,Math.max(1,value));
}
function updateDetailQuantity(qty){
 const input=document.getElementById('detailQty');input.dataset.quantity=qty;
 document.getElementById('detailTotal').textContent=won(selected.price*qty);
 document.getElementById('detailLineTotal').textContent=won(selected.price*qty);
 document.getElementById('detailTotalQty').textContent=qty;
 document.getElementById('quantityMinus').disabled=qty===1;
 document.getElementById('quantityPlus').disabled=qty>=selected.stock;
}
function detailQty(delta){
 if(!canBuy(selected))return;
 const input=document.getElementById('detailQty');
 const qty=Math.min(selected.stock,Math.max(1,normalizeDetailQuantity(input.value,selected.stock,Number(input.dataset.quantity)||1)+delta));
 input.value=qty;updateDetailQuantity(qty);
}
function cartAddResult(stock, current, requested){
 const available=Math.max(0,Number(stock)||0);
 const retained=Math.min(available,Math.max(0,Number(current)||0));
 const added=Math.min(Math.max(0,available-retained),requested);
 const quantity=retained+added;
 const message=current>available
   ? `재고가 줄어 장바구니 수량을 ${available}개로 조정했어요. 더 담을 수 없어요.`
   : added===0 ? `이 상품은 최대 ${available}개까지 구매할 수 있어요. 이미 장바구니에 모두 담겨 있어요.`
   : added<requested ? `재고 한도로 ${added}개만 추가했어요. 장바구니에 총 ${quantity}개가 담겨 있어요.`
   : `장바구니에 ${added}개 담았어요.`;
 return {quantity,added,message};
}
function addSelected(){
 detailQty(0);
 const id=selected.id,qty=Number(document.getElementById('detailQty').value);
 requireLogin(()=>{
  const previousCart=cart;
  try {
   products=JSON.parse(localStorage.goodsProducts||JSON.stringify(products));
   cart=JSON.parse(localStorage.goodsCart||JSON.stringify(cart));
   const p=products.find(product=>product.id===id);
   if(!canBuy(p)){
    renderCart(false);renderProductPage(id);
    showStoreToast('판매 상태가 변경되어 담을 수 없어요. 다른 상품을 선택해 주세요.');return;
   }
   const existing=cart.find(item=>item.id===id);
   const result=cartAddResult(p.stock,existing?.qty||0,qty);
   if(existing){existing.qty=result.quantity;existing.priceAtAdd=p.price;}
   else cart.push({id,qty:result.quantity,priceAtAdd:p.price});
   // Adding to the cart must not overwrite inventory or order history.
   renderCart(false);
   showStoreToast(result.message);
  } catch(error){cart=previousCart;showStoreToast('장바구니에 저장하지 못했어요. 다시 시도해 주세요.');}
 });
}

const productId=Number(new URLSearchParams(location.search).get("id"));renderProductPage(productId);window.addEventListener("store-data-change",()=>renderProductPage(productId));

(function () {
  const STORE_URL = 'https://www.kra.co.kr/letsrunPlay/detail/detail-mall-friends-store.html';
  const TABS = [['pdbDetail', '상세설명'], ['pdbShipping', '배송 안내'], ['pdbCancel', '취소·반품']];
  const baseRender = renderProductPage;
  let pinned = null;

  function section(id, nodes) {
    const el = document.createElement('section');
    el.id = id; el.className = 'pdb-section';
    nodes.forEach(n => el.append(n));
    return el;
  }

  function moreProducts(id) {
    const list = products.filter(p => p.id !== id && !p.deletedAt && p.status !== 'hidden').slice(0, 8);
    if (!list.length) return '';
    return '<section class="pdb-more"><h2>다른 말마 굿즈</h2><div class="pdb-more__rail">' + list.map(p =>
      `<a class="pdb-card" href="product-b.html?id=${p.id}">${productVisual(p, 'pdb-card__img')}<strong>${escapeText(p.name)}</strong><span>${won(p.price)}</span></a>`
    ).join('') + '</div></section>';
  }

  function dragToScroll(rail) {
    if (!rail) return;
    let active = false, startX = 0, startLeft = 0, moved = false;
    rail.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      active = true; moved = false; startX = e.clientX; startLeft = rail.scrollLeft;
      rail.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', e => {
      if (!active) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      if (moved) rail.scrollLeft = startLeft - dx;
    });
    const end = () => { if (!active) return; active = false; rail.classList.remove('is-dragging'); };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    rail.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    rail.addEventListener('dragstart', e => e.preventDefault());
  }

  function build(id) {
    const layout = productPage.querySelector('.product-layout');
    if (!layout) return;
    const art = layout.querySelector('.detail-art');
    const info = layout.querySelector('.purchase-info');
    const detail = productPage.querySelector('.product-information');
    const nodes = [...detail.children];
    const heads = nodes.filter(el => el.tagName === 'H2');
    const shippingAt = nodes.indexOf(heads[1]), cancelAt = nodes.indexOf(heads[2]);

    const tabs = document.createElement('nav');
    tabs.className = 'pdb-tabs'; tabs.setAttribute('aria-label', '상품 정보 바로가기');
    tabs.innerHTML = TABS.map(([target, label], i) => `<button type="button" data-target="${target}" class="${i ? '' : 'is-active'}">${label}</button>`).join('');

    const main = document.createElement('div'); main.className = 'pdb-main';
    main.append(art, tabs,
      section('pdbDetail', nodes.slice(1, shippingAt)),
      section('pdbShipping', nodes.slice(shippingAt, cancelAt)),
      section('pdbCancel', nodes.slice(cancelAt)));

    const side = document.createElement('aside'); side.className = 'pdb-side';
    side.append(info);
    info.insertAdjacentHTML('beforeend', `<a class="pdb-brand" href="${STORE_URL}" target="_blank" rel="noopener"><img src="assets/product-malma-default.png" alt=""><span><strong>말마프렌즈스토어</strong><small>렛츠런파크 서울에서도 만나요 →</small></span></a>`);

    const wrap = document.createElement('div'); wrap.className = 'pdb';
    wrap.append(main, side);
    layout.replaceWith(wrap);
    detail.remove();
    wrap.insertAdjacentHTML('afterend', moreProducts(id));
    dragToScroll(wrap.nextElementSibling && wrap.nextElementSibling.querySelector('.pdb-more__rail'));

    tabs.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (btn) goTo(btn.dataset.target);
    });
    pinned = null;
    syncTabs();
  }

  function goTo(id) {
    const target = document.getElementById(id);
    if (!target) return;
    pinned = id;
    syncTabs();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const pending = [...productPage.querySelectorAll('.product-rich-content img')].filter(img => { img.loading = 'eager'; return !img.complete; });
    if (!pending.length) return;
    let left = pending.length;
    const done = () => { if (--left === 0 && pinned === id) target.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    pending.forEach(img => { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); });
  }
  const release = () => { if (pinned) { pinned = null; syncTabs(); } };
  ['wheel', 'touchmove'].forEach(type => window.addEventListener(type, release, { passive: true }));
  window.addEventListener('keydown', e => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) release(); });

  function syncTop() {
    const top = document.querySelector('.top');
    const topHeight = top ? top.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty('--pdb-top', topHeight + 'px');
    const side = productPage.querySelector('.pdb-side');
    if (side) document.documentElement.style.setProperty('--pdb-side-top', Math.min(topHeight + 20, innerHeight - side.offsetHeight - 16) + 'px');
  }

  function syncTabs() {
    const tabs = productPage.querySelector('.pdb-tabs');
    if (!tabs) return;
    const line = tabs.getBoundingClientRect().bottom + 8;
    let current = TABS[0][0];
    TABS.forEach(([id]) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= line) current = id; });
    if (pinned) current = pinned;
    tabs.querySelectorAll('button').forEach(b => {
      const on = b.dataset.target === current;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
  }

  renderProductPage = function (id) { baseRender(id); build(id); syncTop(); };
  build(productId);
  syncTop();
  const header = document.querySelector('.top');
  if (header && window.ResizeObserver) new ResizeObserver(syncTop).observe(header);
  window.addEventListener('resize', syncTop);
  window.addEventListener('scroll', () => requestAnimationFrame(syncTabs), { passive: true });
})();
