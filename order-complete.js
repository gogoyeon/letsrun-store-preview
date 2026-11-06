const completePage=document.getElementById("completePage");
function completionItem(item,order){
 const allocation=order.discountAllocations?.find(x=>x.id===item.id);
 const qty=item.discountQty??allocation?.qty??0,policy=order.discountSnapshot;
 const benefit=policy?.type==='percent'?`${policy.value}%`:policy?.type==='fixed'?won(policy.value):'';
 return `<div class="completion-item"><div class="completion-item-heading"><strong>${escapeText(item.name)}</strong><span>${item.qty}개</span></div>${item.price!=null?`<p>개당 ${won(item.price)}</p>`:''}${qty?`<p>${benefit?escapeText(benefit)+' ':''}할인 적용 ${qty}개${item.qty>qty?` · 정상가 ${item.qty-qty}개`:''}</p>`:''}</div>`;
}
function renderComplete(){
 const order=orders.find(o=>o.number===new URLSearchParams(location.search).get('id'));
 if(!order){completePage.innerHTML=EmptyStates.html('orderMissing');return;}
 const discount=order.discountAmount||0;
 const subtotal=order.subtotal??order.items.reduce((sum,x)=>sum+(x.price||0)*x.qty,0);
 const shipping=order.shippingFee??Math.max(0,order.total-subtotal+discount);
 completePage.innerHTML=`<p class="eyebrow">ORDER COMPLETE</p><h1 tabindex="-1">주문이 완료되었습니다.</h1><p>주문 내역에서 배송 상태를 확인할 수 있습니다.</p><div class="completion-card"><p class="completion-number">주문번호 <strong>${escapeText(order.number)}</strong></p>${order.items.map(item=>completionItem(item,order)).join('')}<dl class="cost-summary"><div><dt>상품 금액</dt><dd>${won(subtotal)}</dd></div>${discount?`<div class="completion-discount"><dt>할인금액<small>${escapeText((order.discountSnapshot?.name||'행사 할인').replace(/\s*\(시연\)/g,''))}</small></dt><dd>−${won(discount)}</dd></div>`:''}<div><dt>배송비</dt><dd>${shipping?won(shipping):'무료'}</dd></div><div class="grand-total"><dt>총 결제금액</dt><dd>${won(order.total)}</dd></div></dl></div><div class="completion-actions"><a class="primary" href="orders.html">주문 내역 확인</a><a class="outline" href="products.html">쇼핑 계속하기</a></div>`;
}
requireLogin(renderComplete);window.addEventListener("store-data-change",renderComplete);
