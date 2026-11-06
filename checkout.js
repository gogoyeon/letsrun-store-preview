let appliedPromoCode='',promoMessage='',discountMode='none';
const checkoutForm=document.getElementById("checkoutForm");
const addressModal=document.getElementById('addressModal');
function closeAddressSearch(){addressModal.hidden=true;document.getElementById('searchAddress').focus();}
document.getElementById('closeAddress').onclick=closeAddressSearch;
addressModal.addEventListener('click',e=>{if(e.target===addressModal)closeAddressSearch();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!addressModal.hidden){e.preventDefault();closeAddressSearch();}});
document.getElementById('searchAddress').onclick=()=>{
  const Postcode=window.kakao?.Postcode||window.daum?.Postcode;
  const status=document.getElementById('addressStatus');
  if(!Postcode){status.textContent='주소 검색을 불러오지 못했습니다. 우편번호와 주소를 직접 입력해 주세요.';return;}
  status.textContent='';
  addressModal.hidden=false;
  const container=document.getElementById('addressSearchContainer');
  container.replaceChildren();
  new Postcode({width:'100%',height:'100%',oncomplete:data=>{
    document.getElementById('postcode').value=data.zonecode;
    document.getElementById('baseAddress').value=(data.userSelectedType==='R'?data.roadAddress:data.jibunAddress)||data.address||data.roadAddress||data.jibunAddress;
    document.getElementById('detailAddress').value='';
    closeAddressSearch();
    document.getElementById('detailAddress').focus();
  }}).embed(container,{autoClose:false});
};
let selectedDiscountId='',displayedDiscountQuote=null;
let checkoutDraft=JSON.parse(sessionStorage.goodsCheckout||'null');
const purchaseAgreement=document.getElementById('purchaseAgreement');
const privacyAgreement=document.getElementById('privacyAgreement');
const paymentButton=checkoutForm.querySelector('button.primary');
function renderPurchaseNotices(){
  const text=String(storeSettings.purchaseNoticesText ?? '');
  document.getElementById('purchaseNotices').textContent=text;
  purchaseAgreement.nextElementSibling.replaceChildren(document.createTextNode(CheckoutContent.consent.purchaseText+' '),Object.assign(document.createElement('strong'),{textContent:'(필수)'}));
  privacyAgreement.nextElementSibling.replaceChildren(document.createTextNode(CheckoutContent.consent.privacyText+' '),Object.assign(document.createElement('strong'),{textContent:'(필수)'}));
  purchaseAgreement.checked=false;privacyAgreement.checked=false;updatePaymentAvailability();
}
function updatePaymentAvailability(){paymentButton.disabled=!(purchaseAgreement.checked&&privacyAgreement.checked);}
purchaseAgreement.addEventListener('change',updatePaymentAvailability);
privacyAgreement.addEventListener('change',updatePaymentAvailability);
checkoutForm.addEventListener('reset',()=>{paymentButton.disabled=true;});
// One persistent preview account per browser. Production must use the authenticated server member ID.
function discountAccountContext(){
 let accountId=localStorage.getItem('goodsPreviewAccountId');
 if(!accountId){accountId='preview-'+crypto.randomUUID();localStorage.setItem('goodsPreviewAccountId',accountId);}
 return {accountId,orders:JSON.parse(localStorage.getItem('goodsOrders')||'[]')};
}
function currentDiscountQuote(){return GoodsDiscounts.quote(selectedDiscountId,checkoutDraft?.items||[],products,Date.now(),{...discountAccountContext(),promoCode:appliedPromoCode});}
function renderDiscountSelector(){
 const context=discountAccountContext();
 const offers=GoodsDiscounts.read().filter(policy=>policy.mode!=='code'&&GoodsDiscounts.calculate(policy,checkoutDraft.items,products).amount>0).map(policy=>({policy,remaining:GoodsDiscounts.remainingQty(policy,context),...GoodsDiscounts.calculate(policy,checkoutDraft.items,products,Date.now(),context)})).sort((a,b)=>b.amount-a.amount);
 const quote=currentDiscountQuote();displayedDiscountQuote=JSON.stringify(quote);
 return `<fieldset class="checkout-discount discount-options"><legend>할인 적용</legend>
 <label class="discount-check"><input type="radio" name="discountMode" value="none" ${discountMode==='none'?'checked':''}><span class="discount-option-copy"><strong>적용 안 함</strong></span></label>
 <label class="discount-check"><input type="radio" name="discountMode" value="public" aria-controls="generalDiscountFields" aria-expanded="${discountMode==='public'}" ${discountMode==='public'?'checked':''}><span class="discount-option-copy"><strong id="generalDiscountTitle">일반 할인</strong></span></label>
 <section id="generalDiscountFields" class="general-discount-fields" aria-labelledby="generalDiscountTitle" ${discountMode==='public'?'':'hidden'}>${offers.map(({policy:d,remaining})=>`<label class="discount-check"><input type="radio" name="checkoutDiscount" value="${escapeText(d.id)}" ${discountMode==='public'&&d.id===selectedDiscountId?'checked':''} ${remaining?'':'disabled'}><span class="discount-option-copy"><strong>${escapeText(d.name)} · ${d.type==='percent'?d.value+'%':won(d.value)} 할인</strong>${d.noticeText?`<small class="discount-option-notice">${escapeText(d.noticeText)}</small>`:''}</span><span class="discount-account-limit">계정당 최대 ${d.maxQty}개 · ${remaining?`남은 수량 ${remaining}개`:'한도 소진'}</span></label>`).join('')}${offers.length?'':'<p class="discount-help">적용 가능한 일반 할인이 없습니다.</p>'}</section>
 <label class="discount-check"><input type="radio" name="discountMode" value="code" aria-controls="promoCodeFields" aria-expanded="${discountMode==='code'}" ${discountMode==='code'?'checked':''}><span class="discount-option-copy"><strong id="promoCodeTitle">프로모션 코드</strong></span></label><section id="promoCodeFields" class="promo-code-area" aria-labelledby="promoCodeTitle" ${discountMode==='code'?'':'hidden'}><div class="promo-code-entry"><input id="promoCodeInput" aria-label="프로모션 코드" maxlength="24" autocomplete="off" placeholder="코드를 입력해 주세요" value="${escapeText(appliedPromoCode)}"><button type="button" id="applyPromoCode" class="outline">적용</button></div><p class="discount-help">일반 할인 또는 프로모션 코드 중 하나만 적용할 수 있습니다.</p>${quote.policy?.mode==='code'?`<div class="promo-code-success"><span class="discount-option-copy"><strong>${escapeText(quote.policy.name)} · ${quote.policy.type==='percent'?quote.policy.value+'%':won(quote.policy.value)+' / 개'} 할인</strong><small class="discount-option-notice">${escapeText(quote.policy.code)} · 계정당 최대 ${quote.policy.maxQty}개 · 이번 주문 ${quote.allocations.reduce((sum,item)=>sum+item.qty,0)}개 적용 · ${won(quote.amount)} 할인 적용</small></span><button type="button" id="removePromoCode">적용 해제</button></div>`:''}<p id="promoCodeMessage" role="status">${escapeText(promoMessage)}</p></section></fieldset>`;
}
function renderCheckoutPage(){
  renderPurchaseNotices();
  const valid=Array.isArray(checkoutDraft?.items)&&checkoutDraft.items.length>0&&checkoutDraft.items.every(x=>products.some(p=>p.id===x.id));checkoutForm.hidden=!valid;
  if(!valid){document.getElementById('checkoutSummary').innerHTML=EmptyStates.html('checkout');return;}
  if(selectedDiscountId&&!currentDiscountQuote().amount){selectedDiscountId='';appliedPromoCode='';promoMessage='할인 조건이 변경되었거나 종료되었습니다. 다시 확인해 주세요.';}
  const discount=currentDiscountQuote();
  const sub=checkoutDraft.items.reduce((s,x)=>s+products.find(p=>p.id===x.id).price*x.qty,0),ship=shippingFee(sub);
  document.getElementById('checkoutSummary').innerHTML=`<h2>주문 상품</h2>${checkoutDraft.items.map(x=>{const p=products.find(p=>p.id===x.id),applied=discount.allocations.find(a=>a.id===x.id);return `<div class="checkout-item checkout-item-detail"><div class="checkout-product-heading"><a href="product.html?id=${p.id}">${escapeText(p.name)}</a><span>${x.qty}개</span></div><p class="checkout-unit-price">개당 ${won(p.price)}</p>${applied?`<p class="checkout-discount-condition">${discount.policy.type==='percent'?discount.policy.value+'%':won(applied.unitDiscount)} 할인 적용 ${applied.qty}개${x.qty>applied.qty?` · 정상가 ${x.qty-applied.qty}개`:''}</p>`:''}</div>`;}).join('')}<dl class="cost-summary"><div><dt>상품 금액</dt><dd>${won(sub)}</dd></div><div class="discount-savings"><dt>할인금액</dt><dd>${discount.amount?'−':''}${won(discount.amount)}</dd></div><div><dt>배송비</dt><dd>${ship?won(ship):'무료'}</dd></div><div class="grand-total"><dt>총 결제금액</dt><dd>${won(sub+ship-discount.amount)}</dd></div></dl>`;
  document.getElementById('checkoutDiscountArea').innerHTML=renderDiscountSelector();
  const applyCode=()=>{
    const result=GoodsDiscounts.applyCode(document.getElementById('promoCodeInput').value,checkoutDraft.items,products,Date.now(),discountAccountContext());
    if(result.error){document.getElementById('promoCodeMessage').textContent=result.error;return;}
    promoMessage=selectedDiscountId&&selectedDiscountId!==result.policy.id?'기존 할인을 프로모션 코드 할인으로 변경했습니다.':'프로모션 코드를 적용했습니다.';
    discountMode='code';selectedDiscountId=result.policy.id;appliedPromoCode=result.code;renderCheckoutPage();document.getElementById('removePromoCode')?.focus();
  };
  document.getElementById('applyPromoCode').onclick=applyCode;
  document.getElementById('promoCodeInput').onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();applyCode();}};
  const removeCode=document.getElementById('removePromoCode');
  if(removeCode)removeCode.onclick=()=>{selectedDiscountId='';appliedPromoCode='';promoMessage='프로모션 코드 적용을 해제했습니다.';renderCheckoutPage();document.getElementById('promoCodeInput').focus();};
  document.querySelectorAll('input[name="discountMode"]').forEach(input=>{input.onchange=()=>{
    discountMode=input.value;selectedDiscountId='';appliedPromoCode='';promoMessage='';renderCheckoutPage();
    document.querySelector('input[name="discountMode"]:checked')?.focus();
  };});
  document.querySelectorAll('input[name="checkoutDiscount"]').forEach(input=>{input.onchange=()=>{
    selectedDiscountId=input.value;renderCheckoutPage();document.querySelector('input[name="checkoutDiscount"]:checked')?.focus();
  };});
}
checkoutForm.onsubmit=e=>{e.preventDefault();products=JSON.parse(localStorage.goodsProducts||JSON.stringify(products));orders=JSON.parse(localStorage.goodsOrders||JSON.stringify(orders));if(!purchaseAgreement.checked){purchaseAgreement.reportValidity();return;}if(!privacyAgreement.checked){privacyAgreement.reportValidity();return;}if(!checkoutForm.elements.address.value.trim()){document.getElementById('addressStatus').textContent='배송지 주소를 입력해 주세요.';document.getElementById('searchAddress').focus();return;}if(checkoutDraft?.items?.some(item=>item.priceAtCheckout!==products.find(p=>p.id===item.id)?.price)){checkoutDraft.items.forEach(item=>{item.priceAtCheckout=products.find(p=>p.id===item.id)?.price;});sessionStorage.goodsCheckout=JSON.stringify(checkoutDraft);renderCheckoutPage();return alert('상품 금액이 변경되었습니다. 변경된 주문 금액을 확인해 주세요.');}if(!cartValid(checkoutDraft?.items)){renderCheckoutPage();return alert('판매 상태나 재고가 변경되었습니다. 상품을 다시 선택해 주세요.');}requireLogin(()=>{
  if(!cartValid(checkoutDraft?.items))return renderCheckoutPage();
  const f=Object.fromEntries(new FormData(checkoutForm)),items=checkoutDraft.items.map(x=>({...x,name:products.find(p=>p.id===x.id).name,price:products.find(p=>p.id===x.id).price}));
  const sub=items.reduce((s,x)=>s+products.find(p=>p.id===x.id).price*x.qty,0);
  const discount=currentDiscountQuote();
  if(JSON.stringify(discount)!==displayedDiscountQuote){renderCheckoutPage();return alert('할인 조건이 변경되었거나 종료되었습니다. 결제금액을 다시 확인해 주세요.');}
  items.forEach(item=>{const applied=discount.allocations.find(x=>x.id===item.id);item.discountAmount=applied?.amount||0;item.discountQty=applied?.qty||0;});
  const approvedAt=Date.now(),order={...f,accountId:discountAccountContext().accountId,baseAddress:f.address,address:[f.address,f.detailAddress.trim()].filter(Boolean).join(' '),number:CheckoutContent.nextOrderNumber(approvedAt,orders),date:new Date(approvedAt).toLocaleDateString('ko-KR'),createdAt:approvedAt,approvedAt,cancelUntil:approvedAt+storeSettings.cancelHours*3600000,returnDays:storeSettings.returnDays,policySnapshot:{...storeSettings},items,subtotal:sub,shippingFee:shippingFee(sub),total:sub+shippingFee(sub)-discount.amount,discountAmount:discount.amount,discountSnapshot:discount.policy,discountAllocations:discount.allocations,status:'출고 대기',purchaseConsent:{version:storeSettings.purchasePolicyVersion,agreementVersion:CheckoutContent.consent.purchaseVersion,text:CheckoutContent.consent.purchaseText,notices:String(storeSettings.purchaseNoticesText ?? ''),agreedAt:approvedAt},privacyConsent:{version:CheckoutContent.consent.privacyVersion,text:CheckoutContent.consent.privacyText,agreedAt:approvedAt},demo:true};
  items.forEach(x=>{const p=products.find(p=>p.id===x.id);Inventory.change(p,-x.qty,'주문 결제','고객',order.number+':purchase');});
  if(checkoutDraft.source==='cart'){cart=cart.map(x=>({...x,qty:x.qty-(items.find(i=>i.id===x.id)?.qty||0)})).filter(x=>x.qty>0);}
  orders.unshift(order);checkoutDraft=null;sessionStorage.removeItem('goodsCheckout');save();renderCart();checkoutForm.reset();StorePages.go('complete/'+order.number);
});};

requireLogin(renderCheckoutPage);window.addEventListener("store-data-change",renderCheckoutPage);

window.addEventListener('storage',event=>{if(event.key===GoodsDiscounts.key||event.key==='goodsOrders')renderCheckoutPage();});
