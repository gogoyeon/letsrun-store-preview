const won=n=>new Intl.NumberFormat('ko-KR').format(n)+'원';
const base=sampleProducts;
let products=JSON.parse(localStorage.goodsProducts||'null')||base,cart=JSON.parse(localStorage.goodsCart||'[]'),orders=JSON.parse(localStorage.goodsOrders||'[]');let selected=null;
// Seed the expanded preview catalog once, preserving edited products and inventory.
if(localStorage.goodsSampleCatalogVersion!=='20260918'){
  const existingIds=new Set(products.map(p=>p.id));
  products.push(...base.filter(p=>p.id>=4&&!existingIds.has(p.id)));
  localStorage.goodsProducts=JSON.stringify(products);
  localStorage.goodsSampleCatalogVersion='20260918';
}
// Preview state only; production login must use a server-verified OAuth session.
let loginPreviewActive=sessionStorage.goodsPreviewLogin==='1',pendingLoginAction=null;
const loginDialog=document.getElementById('loginModal');
function requireLogin(action){
  if(loginPreviewActive){action();return;}
  pendingLoginAction=action;
  document.getElementById('loginStatus').textContent='로그인 방법을 선택해 주세요.';
  loginDialog.showModal();
}
loginDialog.addEventListener('close',()=>{pendingLoginAction=null;});
document.querySelectorAll('[data-provider]').forEach(button=>button.addEventListener('click',()=>{
  const action=pendingLoginAction;
  pendingLoginAction=null;
  loginPreviewActive=true;
  sessionStorage.goodsPreviewLogin='1';
  loginDialog.close();
  action?.();
}));
const escapeText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const canBuy=p=>p&&!p.deletedAt&&p.status==='sale'&&p.stock>0;
// Prototype defaults; production reads these values from administrator settings.
const storeSettings=CheckoutContent.migrateShippingSettings({...CheckoutContent.defaults,shippingFee:3000,returnShippingFee:6000,cancelHours:24,returnDays:14,returnAddress:'경기도 과천시 경마공원대로 107 렛츠런파크 굿즈 반품 담당',...JSON.parse(localStorage.goodsSettings||'{}')});
const shippingAnnouncement=document.getElementById('shippingAnnouncement');
if(shippingAnnouncement){
  const dismissalKey='goodsShippingBannerDismissedDay';
  const koreaOffset=9*60*60*1000,dayLength=24*60*60*1000;
  const today=()=>new Date(Date.now()+koreaOffset).toISOString().slice(0,10);
  let dismissedDay='',midnightTimer;
  function syncShippingAnnouncement(){
    try{dismissedDay=localStorage.getItem(dismissalKey)||'';}catch{/* Keep this page usable if browser storage is unavailable. */}
    shippingAnnouncement.hidden=dismissedDay===today();
    clearTimeout(midnightTimer);
    // Recheck at Korean midnight even when the customer leaves this page open.
    midnightTimer=setTimeout(syncShippingAnnouncement,dayLength-((Date.now()+koreaOffset)%dayLength)+100);
  }
  document.getElementById('shippingAnnouncementClose').onclick=()=>{
    dismissedDay=today();
    try{localStorage.setItem(dismissalKey,dismissedDay);}catch{/* Closing still works for the current page. */}
    shippingAnnouncement.hidden=true;
  };
  window.addEventListener('storage',event=>{if(event.key===dismissalKey||event.key===null)syncShippingAnnouncement();});
  window.addEventListener('focus',syncShippingAnnouncement);
  window.addEventListener('pageshow',syncShippingAnnouncement);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncShippingAnnouncement();});
  syncShippingAnnouncement();
}
// A product uses the same representative-image frame in both views.
function productVisual(p,className='product-image',position){
 const colors=['#e9e5df','#e1eadb','#f3ddd4'];
 const index=position??Math.max(0,(Number(p.displayOrder)||Number(p.id)||1)-1);
 const background=colors[index%3],src=p.image||'assets/product-malma-default.png';
 const isDefault=src==='assets/product-malma-default.png';
 return `<div class="${className}${isDefault?' default-product-image':''}" style="background:${background}!important"><img src="${escapeText(src)}" alt="${escapeText(p.name)}"></div>`;
};

function storePageRows(items,size,page,containerId,anchor,onChange){
  let container=document.getElementById(containerId);
  if(!container){container=document.createElement('nav');container.id=containerId;container.className='store-pagination';container.setAttribute('aria-label',containerId==='catalogPagination'?'상품 목록 페이지':'주문 목록 페이지');anchor.insertAdjacentElement('afterend',container);}
  const pages=Math.max(1,Math.ceil(items.length/size)),current=Math.max(1,Math.min(page,pages));
  container.hidden=items.length<=size;
  container.innerHTML=`<span>총 ${items.length}개 · ${current}/${pages}페이지</span><button type="button" data-page="${current-1}" ${current===1?'disabled':''}>이전</button><button type="button" data-page="${current+1}" ${current===pages?'disabled':''}>다음</button>`;
  container.querySelectorAll('[data-page]').forEach(button=>button.onclick=()=>onChange(Number(button.dataset.page)));
  return {page:current,rows:items.slice((current-1)*size,current*size)};
}

function save(){localStorage.goodsProducts=JSON.stringify(products);localStorage.goodsCart=JSON.stringify(cart);localStorage.goodsOrders=JSON.stringify(orders);}
const shippingFee=sub=>sub>0?storeSettings.shippingFee:0;
const cartValid=items=>Array.isArray(items)&&items.length>0&&items.every(item=>Number.isInteger(item.qty)&&item.qty>0&&canBuy(products.find(p=>p.id===item.id))&&products.find(p=>p.id===item.id).stock>=item.qty);
function updateSelection(){const count=cart.reduce((sum,item)=>sum+item.qty,0);cartCount.textContent=count;cartToggle.hidden=count===0;if(!count){cartPanel.classList.remove('open');cartPanel.hidden=true;}}
function renderCart(notifyChanges=true){
  const before=cart.length;cart=cart.filter(item=>canBuy(products.find(product=>product.id===item.id)));
  if(notifyChanges && before!==cart.length)queueMicrotask(()=>showStoreToast('구매할 수 없는 상품이 장바구니에서 제외되었습니다.'));
  cart.forEach(item=>{const product=products.find(p=>p.id===item.id);item.qty=Math.min(item.qty,product.stock);item.priceAtAdd=product.price;});
  localStorage.goodsCart=JSON.stringify(cart);
  cartItems.innerHTML=cart.map(item=>{const product=products.find(p=>p.id===item.id);return `<div class="cart-row"><div><strong>${escapeText(product.name)}</strong><small>${won(product.price)}</small></div><div class="qty"><button class="qty-step" aria-label="수량 줄이기" onclick="changeQty(${item.id},-1)" ${item.qty<=1?'disabled':''}>−</button><input class="qty-value qty-input" type="text" inputmode="numeric" pattern="[0-9]*" aria-label="${escapeText(product.name)} 수량" value="${item.qty}" oninput="inputCartQty(${item.id},this,false)" onblur="inputCartQty(${item.id},this,true)" onkeydown="if(event.key==='Enter'){event.preventDefault();inputCartQty(${item.id},this,true)}"><button class="qty-step" aria-label="수량 늘리기" onclick="changeQty(${item.id},1)" ${item.qty>=product.stock?'disabled':''}>+</button><button class="qty-remove" aria-label="상품 삭제" onclick="removeCart(${item.id})">×</button></div></div>`;}).join('')||EmptyStates.html('cart');
  updateCartTotals();
}
function updateCartTotals(){
  const sub=cart.reduce((sum,item)=>sum+products.find(p=>p.id===item.id).price*item.qty,0);subtotal.textContent=won(sub);shipping.textContent=won(shippingFee(sub));total.textContent=won(sub+shippingFee(sub));updateSelection();
}
function cartQuantityValue(raw, stock, previous, commit){
 const value=Number(raw),valid=/^\d+$/.test(raw)&&Number.isSafeInteger(value);
 if(!commit)return valid&&value>=1&&value<=stock?value:null;
 return Math.max(1,Math.min(stock,valid?value:previous));
}
function inputCartQty(id,input,commit){
 const item=cart.find(item=>item.id===id),product=products.find(product=>product.id===id);
 if(!item||!canBuy(product))return renderCart();
 const qty=cartQuantityValue(input.value,product.stock,item.qty,commit);
 if(qty===null)return;
 item.qty=qty;
 if(commit)input.value=qty;
 const buttons=input.closest('.qty').querySelectorAll('.qty-step');
 buttons[0].disabled=qty<=1;buttons[1].disabled=qty>=product.stock;
 localStorage.goodsCart=JSON.stringify(cart);
 updateCartTotals();
}
function changeQty(id,delta){const item=cart.find(item=>item.id===id),product=products.find(p=>p.id===id);if(!item||!canBuy(product))return renderCart();item.qty=Math.max(1,Math.min(product.stock,item.qty+delta));renderCart();}
function removeCart(id){cart=cart.filter(item=>item.id!==id);renderCart();}
function startCheckout(items,source){
  if(!cartValid(items))return alert('구매할 수 있는 상품과 수량을 선택해 주세요.');
  requireLogin(()=>{sessionStorage.goodsCheckout=JSON.stringify({items:items.map(item=>({...item,priceAtCheckout:products.find(p=>p.id===item.id).price})),source});StorePages.go('checkout');});
}
cartToggle.onclick=()=>requireLogin(()=>{if(!cart.length)return;renderCart();cartPanel.hidden=false;cartPanel.classList.add('open');});
checkout.onclick=()=>startCheckout(cart,'cart');
ordersToggle.onclick=event=>{event.preventDefault();requireLogin(()=>StorePages.go('orders'));};
document.addEventListener('click',event=>{const button=event.target.closest('[data-close]');if(!button)return;const target=document.getElementById(button.dataset.close);if(target instanceof HTMLDialogElement)target.close();else{target.classList.remove('open');target.hidden=true;}});
let storeToastTimer;
function showStoreToast(message){const toast=document.getElementById('storeToast');clearTimeout(storeToastTimer);toast.textContent=message;toast.hidden=false;storeToastTimer=setTimeout(()=>{toast.hidden=true;toast.textContent='';},5000);}
// Add example orders once without replacing purchases already saved in this browser.
function seedExampleOrders(){
  if(localStorage.goodsExampleOrdersVersion==='1')return;
  const now=Date.now(),hour=3600000,day=24*hour;
  const customer={name:'김말마',phone:'010-0000-0000',recipient:'김말마',recipientPhone:'010-0000-0000',address:'경기도 과천시 경마공원대로 107, 1층 수령처',request:'배송 전 연락 부탁드립니다.',shippingFee:storeSettings.shippingFee,inventoryApplied:false};
  const examples=[
    {...customer,number:'G-EXAMPLE-1003',createdAt:now-hour,cancelUntil:now+storeSettings.cancelHours*hour,status:'출고 대기',items:[{id:1,name:'말마 인형',price:29000,qty:2},{id:2,name:'경주마 인형 A',price:26000,qty:1}],subtotal:84000},
    {...customer,number:'G-EXAMPLE-1002',createdAt:now-7*day,cancelUntil:now-6*day,status:'출고 완료',trackingNumber:'000000000000',items:[{id:2,name:'경주마 인형 A',price:26000,qty:2}],subtotal:52000},
    {...customer,number:'G-EXAMPLE-1001',createdAt:now-10*day,cancelUntil:now-9*day,status:'전체 취소',items:[{id:1,name:'말마 인형',price:29000,qty:1}],subtotal:29000}
  ].map(o=>({...o,date:new Date(o.createdAt).toLocaleDateString('ko-KR'),total:o.subtotal+o.shippingFee}));
  const existing=new Set(orders.map(o=>o.number));
  orders.push(...examples.filter(o=>!existing.has(o.number)));
  orders.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  save();localStorage.goodsExampleOrdersVersion='1';
}
seedExampleOrders();
function seedReturnExamples(){
  if(localStorage.goodsReturnExampleVersion==='3')return;
  const now=Date.now(),day=86400000,requested=orders.find(o=>o.number==='G-EXAMPLE-1002');
  if(requested)Object.assign(requested,{status:'출고 완료',returnStatus:'신청 완료',returnReason:'단순 변심',returnDetail:'상품을 확인했으나 생각했던 크기와 달라 전체 반품을 요청합니다.',returnMethod:'고객 직접 반송(착불)',returnCarrier:'',returnTrackingNumber:'',returnRequestedAt:now-2*day});
  if(!orders.some(o=>o.number==='G-EXAMPLE-1004'))orders.push({name:'정말마',phone:'010-0000-0000',recipient:'정말마',recipientPhone:'010-0000-0000',address:'서울특별시 중구 세종대로 110, 수령처',number:'G-EXAMPLE-1004',createdAt:now-3*day,date:new Date(now-3*day).toLocaleDateString('ko-KR'),status:'출고 완료',carrier:'CJ대한통운',trackingNumber:'777788889999',items:[{id:5,name:'말마 인형 키링',price:12000,qty:2}],subtotal:24000,shippingFee:storeSettings.shippingFee,total:24000+storeSettings.shippingFee,inventoryApplied:false});
  if(!orders.some(o=>o.number==='G-EXAMPLE-1000'))orders.push({name:'최말마',phone:'010-0000-0000',recipient:'최말마',recipientPhone:'010-0000-0000',address:'제주특별자치도 제주시 애월읍 평화로 2144',number:'G-EXAMPLE-1000',createdAt:now-14*day,date:new Date(now-14*day).toLocaleDateString('ko-KR'),status:'출고 완료',carrier:'우체국택배',trackingNumber:'111122223333',items:[{id:4,name:'말마 미니 인형',price:19000,qty:2}],subtotal:38000,shippingFee:storeSettings.shippingFee,total:38000+storeSettings.shippingFee,inventoryApplied:false,returnStatus:'환불 완료',returnReason:'상품 불량·파손',returnDetail:'상품 포장이 훼손된 상태로 배송되었습니다.',returnMethod:'고객 직접 반송(착불)',returnCarrier:'우체국택배',returnTrackingNumber:'444455556666',returnRequestedAt:now-12*day,shippingDeduction:0,refundAmount:38000+storeSettings.shippingFee,customerRefundNote:'상품 파손으로 확인되어 반품 배송비 차감 없이 결제금액 전액을 환불해 드렸습니다.',refundCompletedAt:now-10*day});
  orders.forEach(order=>{if(order.returnStatus&&['수거 접수','직접 발송'].includes(order.returnMethod))order.returnMethod='고객 직접 반송(착불)';});
  orders.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));save();localStorage.goodsReturnExampleVersion='3';
}
seedReturnExamples();
OrderDemoData.seed(orders);
save();

function reloadStoreData(){products=JSON.parse(localStorage.goodsProducts||'null')||sampleProducts;cart=JSON.parse(localStorage.goodsCart||'[]');orders=JSON.parse(localStorage.goodsOrders||'[]');Object.assign(storeSettings,CheckoutContent.defaults,JSON.parse(localStorage.goodsSettings||'{}'));loginPreviewActive=sessionStorage.goodsPreviewLogin==='1';renderCart();window.dispatchEvent(new Event('store-data-change'));}
window.addEventListener('storage',event=>{if(['goodsProducts','goodsOrders','goodsCart','goodsSettings'].includes(event.key))reloadStoreData();});
window.addEventListener('pageshow',event=>{if(event.persisted)reloadStoreData();});
renderCart();
