function orderItemDiscountNote(item,order){
 const allocation=order.discountAllocations?.find(x=>x.id===item.id);
 const amount=item.discountAmount??allocation?.amount??0;
 if(!amount)return '';
 const policy=order.discountSnapshot,qty=item.discountQty??allocation?.qty;
 const name=(policy?.name||'행사 할인').replace(/\s*\(시연\)/g,'');
 const rate=policy?.type==='percent'?`${policy.value}%`:policy?.type==='fixed'?`개당 ${won(policy.value)}`:'';
 const parts=[name,rate,qty?`${qty}개 적용`:''].filter(Boolean);
 return `<div class="order-item-discount"><span>${parts.map(escapeText).join(' · ')}</span><strong>총 ${won(amount)} 할인</strong></div>`;
}

const orderList=document.getElementById("orderList"),detailNumber=new URLSearchParams(location.search).get("id");
const returnDialog=document.getElementById('returnDialog'),returnForm=document.getElementById('returnForm'),returnTrackingDialog=document.getElementById('returnTrackingDialog'),returnTrackingForm=document.getElementById('returnTrackingForm');
let activeReturnOrderNumber='';

function cancelOrder(num){requireLogin(()=>{const o=orders.find(o=>o.number===num);if(!o||!canCancel(o))return alert('취소 가능 시점이 지났거나 이미 처리된 주문입니다.');if(!confirm('주문한 모든 상품을 전액 취소하시겠습니까?'))return;const latestOrders=JSON.parse(localStorage.goodsOrders||JSON.stringify(orders));const latestOrder=latestOrders.find(item=>item.number===num);if(!latestOrder||!canCancel(latestOrder))return alert('주문 상태가 변경되었습니다. 다시 확인해 주세요.');orders=latestOrders;Object.assign(o,latestOrder);products=JSON.parse(localStorage.goodsProducts||JSON.stringify(products));if(o.inventoryApplied!==false)o.items.forEach(i=>{const p=products.find(p=>p.id===i.id);if(p)Inventory.change(p,i.qty,'주문 취소 재고 복원','고객',o.number+':cancel');});o.status='전체 취소';o.cancelledAt=Date.now();o.cancelCompletedAt=o.cancelledAt;Object.assign(latestOrder,o);save();renderOrders();});};

function openReturnRequest(number){
  const order=orders.find(o=>o.number===number);
  if(!order||!canRequestReturn(order))return alert('현재 전체 반품을 신청할 수 없는 주문입니다.');
  activeReturnOrderNumber=number;returnForm.reset();
  document.getElementById('returnOrderNumber').textContent='주문번호 '+number;
  document.getElementById('returnFormError').textContent='';returnDialog.showModal();
}
returnForm.onsubmit=event=>{
  event.preventDefault();const error=document.getElementById('returnFormError'),order=orders.find(o=>o.number===activeReturnOrderNumber);
  if(!order||!canRequestReturn(order)){error.textContent='주문 상태가 변경되었습니다. 주문 내역을 다시 확인해 주세요.';return;}
  const form=Object.fromEntries(new FormData(returnForm));
  Object.assign(order,{returnStatus:'신청 완료',returnReason:form.returnReason,returnDetail:form.returnDetail.trim(),returnMethod:'고객 직접 반송(착불)',returnCarrier:'',returnTrackingNumber:'',returnRequestedAt:Date.now()});
  save();returnDialog.close();renderOrders();showStoreToast('반품 신청이 완료되었습니다. 상품 발송 후 운송장을 등록해 주세요.');
};

function openReturnTracking(number){
  const order=orders.find(o=>o.number===number);
  if(!order||order.returnStatus!=='신청 완료')return alert('운송장을 등록할 수 없는 주문입니다.');
  activeReturnOrderNumber=number;returnTrackingForm.reset();
  returnTrackingForm.elements.returnCarrier.value=order.returnCarrier||'';
  returnTrackingForm.elements.returnTrackingNumber.value=order.returnTrackingNumber||'';
  document.getElementById('returnTrackingOrderNumber').textContent='주문번호 '+number;
  document.getElementById('returnTrackingFormError').textContent='';
  returnTrackingForm.querySelector('button.primary').textContent=order.returnTrackingNumber?'운송장 수정':'운송장 등록';
  returnTrackingDialog.showModal();
}
returnTrackingForm.onsubmit=event=>{
  event.preventDefault();const error=document.getElementById('returnTrackingFormError'),order=orders.find(o=>o.number===activeReturnOrderNumber);
  if(!order||order.returnStatus!=='신청 완료'){error.textContent='반품 상태가 변경되었습니다. 주문 내역을 다시 확인해 주세요.';return;}
  const form=Object.fromEntries(new FormData(returnTrackingForm)),tracking=String(form.returnTrackingNumber||'').replace(/[\s-]/g,'');
  if(!/^[0-9A-Za-z]+$/.test(tracking)){error.textContent='반품 운송장 번호를 영문·숫자로 입력해 주세요.';return;}
  const isFirstRegistration=!order.returnTrackingNumber;
  if(isFirstRegistration&&!confirm('등록 후 운송장 정보는 삭제할 수 없으며 수정만 가능합니다. 등록하시겠습니까?'))return;
  Object.assign(order,{returnCarrier:form.returnCarrier,returnTrackingNumber:tracking,returnTrackingRegisteredAt:order.returnTrackingRegisteredAt||Date.now()});
  save();returnTrackingDialog.close();renderOrders();showStoreToast('반품 운송장 정보가 저장되었습니다.');
};
function withdrawReturn(number){requireLogin(()=>{const order=orders.find(o=>o.number===number);if(!order||order.returnStatus!=='신청 완료')return alert('철회할 수 있는 반품 신청이 없습니다.');if(order.returnTrackingNumber)return alert('반품 운송장이 등록된 신청은 직접 철회할 수 없습니다. 고객센터로 문의해 주세요.');if(!confirm('전체 반품 신청을 철회하시겠습니까?'))return;const withdrawnAt=Date.now(),history={returnReason:order.returnReason||'',returnDetail:order.returnDetail||'',returnRequestedAt:order.returnRequestedAt||null,withdrawnAt};order.returnWithdrawalHistory=[...(order.returnWithdrawalHistory||[]),history];delete order.returnStatus;delete order.returnReason;delete order.returnDetail;delete order.returnMethod;delete order.returnCarrier;delete order.returnTrackingNumber;delete order.returnRequestedAt;delete order.returnTrackingRegisteredAt;order.returnWithdrawnAt=withdrawnAt;save();renderOrders();showStoreToast('반품 신청이 철회되었습니다.');});};

function returnRequestSummary(order){
  if(!order.returnStatus)return '';
  const requestedAt=order.returnRequestedAt?new Date(order.returnRequestedAt).toLocaleString('ko-KR'):'';
  const directTracking=order.returnTrackingNumber?`<div class="return-info-row"><span>반품 운송장</span><strong>${escapeText(order.returnCarrier)} · ${escapeText(order.returnTrackingNumber)}</strong><a class="outline" href="${escapeText(carrierTrackingUrl(order.returnCarrier,order.returnTrackingNumber))}" target="_blank" rel="noopener noreferrer">반품 배송조회 ↗</a></div>`:'';
  const nextStep=order.returnStatus==='신청 완료'?`<div class="return-next-step"><b>${order.returnTrackingNumber?'상품 도착을 확인하고 있습니다.':'이제 상품을 보내주세요.'}</b><div class="return-address"><span>반품 주소</span><br><strong>${escapeText(order.policySnapshot?.returnAddress??storeSettings.returnAddress)}</strong></div><p>주문 상품 전체를 착불로 보내주세요. 단순 변심은 최초·반품 배송비가 환불금에서 차감될 수 있습니다.</p><button type="button" class="outline" onclick="openReturnTracking('${escapeText(order.number)}')">${order.returnTrackingNumber?'반품 운송장 수정':'발송 후 운송장 등록'}</button>${order.returnTrackingNumber?'':`<button type="button" class="return-withdraw-button" onclick="withdrawReturn('${escapeText(order.number)}')">반품 신청 철회</button>`}</div><p class="return-waiting">${order.returnTrackingNumber?'상품 도착 및 확인 후 환불이 진행됩니다.':'운송장 등록 전에는 반품 신청을 철회할 수 있습니다.'}</p>`:'';
  const rejectedInfo=order.returnStatus==='반품 반려'?`<div class="customer-refund-note rejected"><b>반품이 반려되었습니다.</b><p>${escapeText(order.returnRejectReason||'반품이 어려운 상품 상태로 확인되었습니다. 자세한 내용은 고객센터로 문의해 주세요.')}</p><p>재신청과 재발송 처리는 고객센터를 통해 안내받아 주세요.</p></div>`:'';
  const refundInfo=order.returnStatus==='환불 완료'?`<div class="refund-breakdown"><div><span>결제금액</span><strong>${won(order.total)}</strong></div><div><span>배송비 차감</span><strong>${order.shippingDeduction?'-'+won(order.shippingDeduction):'차감 없음'}</strong></div><div class="refund-result"><span>최종 환불액</span><strong>${won(order.refundAmount??order.total)}</strong></div></div><div class="customer-refund-note"><b>환불 안내</b><p>${escapeText(order.customerRefundNote||'환불 처리가 완료되었습니다.')}</p>${order.customerRefundExtraNote?`<p>${escapeText(order.customerRefundExtraNote)}</p>`:''}</div>`:rejectedInfo||nextStep;
  return `<section class="order-section return-status-section"><h3>반품 · 환불</h3><div class="order-info-card"><div class="return-status-heading"><span class="order-state${customerOrderStateClass(order)}">${escapeText(order.returnStatus)}</span>${requestedAt?`<small>${escapeText(requestedAt)} 신청</small>`:''}</div><div class="return-info-row"><span>반품 사유</span><strong>${escapeText(order.returnReason||'—')}</strong></div><div class="return-info-row"><span>반송 방식</span><strong>고객 직접 반송(착불)</strong></div>${directTracking}${order.returnDetail?`<div class="return-detail"><span>상세 사유</span><p>${escapeText(order.returnDetail)}</p></div>`:''}${refundInfo}</div></section>`;
}


function renderOrders(){  const o=orders.find(order=>order.number===detailNumber);if(!o){orderList.innerHTML=EmptyStates.html('orderMissing');return;}
  const ship=o.shippingFee??storeSettings.shippingFee,sub=o.subtotal??o.total-ship;
  let orderAction='';
  if(canCancel(o))orderAction=`<button class="outline" onclick="cancelOrder('${escapeText(o.number)}')">주문 전체 취소</button><p>${new Date(o.cancelUntil).toLocaleString('ko-KR')}까지, 발송 전 취소 가능</p>`;
  else if(canRequestReturn(o))orderAction=`<button class="outline return-request-button" onclick="openReturnRequest('${escapeText(o.number)}')">전체 반품 신청</button><p>${new Date(returnDeadline(o)).toLocaleString('ko-KR')}까지 주문 상품과 수량 전체를 함께 반품할 수 있습니다.</p>`;
  else if(o.returnStatus==='신청 완료')orderAction='<p>반품 신청이 완료되었습니다. 아래 반품 안내에 따라 상품을 직접 보내주세요.</p>';
  else if(o.returnStatus==='환불 완료')orderAction='<p>전체 반품과 환불이 완료되었습니다.</p>';
  else if(o.returnStatus==='반품 반려')orderAction='<p>반품이 반려되었습니다. 재신청과 이후 처리는 고객센터로 문의해 주세요.</p>';
  else orderAction=`<p>${o.status==='전체 취소'?'주문 전체가 취소되었습니다.':o.trackingNumber&&!o.returnStatus&&returnDeadline(o)<=Date.now()?'반품 신청 기간이 지났습니다. 불량·오배송은 고객센터로 문의해 주세요.':'현재 취소하거나 반품할 수 없는 주문입니다.'}</p>`;
  const paymentState=o.status==='전체 취소'?'전액 취소 완료':o.returnStatus==='환불 완료'?'환불 완료':o.returnStatus==='신청 완료'?'반품 신청 완료':o.returnStatus==='반품 반려'?'결제 완료 · 반품 반려':'결제 완료';
  orderList.innerHTML=`<div class="order-detail"><a class="back-link" href="orders.html">← 주문 목록</a><div class="order-detail-header order-info-card"><div><p>${escapeText(o.createdAt?new Date(o.createdAt).toLocaleString('ko-KR'):o.date)}</p><strong>주문번호 ${escapeText(o.number)}</strong></div><span class="order-state${customerOrderStateClass(o)}">${escapeText(customerOrderState(o))}</span></div><details class="order-section" open><summary>주문상품</summary><div class="order-info-card"><div class="order-store-label"><strong>말마프렌즈 온라인 스토어</strong><span>배송비 ${won(ship)}</span></div>${o.items.map(i=>`<div class="order-detail-item"><div class="order-thumbnail">${orderItemVisual(i)}</div><div><strong>${escapeText(i.name+(i.deletedProduct?' (삭제된 상품)':''))}</strong><p>수량 ${i.qty}개</p>${orderItemDiscountNote(i,o)}<b>${i.price!=null?won(i.price*i.qty):'구매 금액은 결제정보에서 확인'}</b></div></div>`).join('')}<div class="order-delivery-line"><span>배송 상태</span><strong>${escapeText(orderStatusLabel(o))}</strong></div>${o.trackingNumber?`<div class="order-delivery-line"><span>${escapeText(o.carrier||'택배사')} · 운송장 번호</span><strong>${escapeText(o.trackingNumber)}</strong></div>`:''}${shipmentLookup(o)}<div class="order-action-area">${orderAction}</div></div></details>${returnRequestSummary(o)}<section class="order-section"><h3>배송지</h3><div class="order-info-card order-address"><strong>${escapeText(o.recipient||o.name)}</strong><p>${escapeText(o.recipientPhone||o.phone)}</p><p>${escapeText(o.address)}${o.postcode?' ('+escapeText(o.postcode)+')':''}</p>${o.request?`<p class="order-memo">배송메모: ${escapeText(o.request)}</p>`:''}</div></section><details class="order-section" open><summary>결제정보</summary><div class="order-info-card"><dl class="order-payment"><div class="payment-total"><dt>주문금액</dt><dd>총 ${won(o.total)}</dd></div><div><dt>상품금액</dt><dd>${won(sub)}</dd></div>${o.discountAmount?`<div><dt>할인 · ${escapeText((o.discountSnapshot?.name||'행사 할인').replace(/\s*\(시연\)/g,''))}</dt><dd>−${won(o.discountAmount)}</dd></div>`:''}<div><dt>배송비</dt><dd>${won(ship)}</dd></div></dl><dl class="order-payment payment-method"><div><dt>결제수단</dt><dd>${escapeText(o.paymentMethod||'카드 결제')}</dd></div><div><dt>결제 상태</dt><dd>${paymentState}</dd></div>${o.status==='전체 취소'?`<div class="refund-total"><dt>취소금액</dt><dd>${won(o.total)}</dd></div>`:o.returnStatus==='환불 완료'?`<div class="refund-total"><dt>환불금액</dt><dd>${won(o.refundAmount??o.total)}</dd></div>`:''}</dl><p class="order-policy">반품은 주문 전체 단위로만 가능하며 일부 상품·수량의 부분 환불은 지원하지 않습니다.</p></div></details></div>`;
}
requireLogin(renderOrders);window.addEventListener("store-data-change",renderOrders);
