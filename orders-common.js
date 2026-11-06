const dayMs=24*60*60*1000;
function returnDeadline(order){
  const startedAt=Number(order.shippedAt||order.trackingRegisteredAt||order.createdAt||0),days=Number(order.returnDays??storeSettings.returnDays)||14;
  return startedAt?startedAt+days*dayMs:0;
}
function canRequestReturn(order){
  const deadline=returnDeadline(order);
  return Boolean(order.trackingNumber)&&order.status!=='전체 취소'&&!order.returnStatus&&!order.returnRejectedAt&&deadline>Date.now();
}
function customerOrderState(order){
  if(order.refundKind==='관리자 예외 환불')return '관리자 예외 환불';if(order.returnStatus==='반품 반려')return '반품 반려';
  if(order.returnStatus==='환불 완료')return '환불 완료';
  if(order.returnStatus==='신청 완료')return order.returnTrackingNumber?'반품 확인 중':'반품 발송 대기';
  return orderStatusLabel(order);
}
function customerOrderStateClass(order){return order.returnStatus==='신청 완료'?' return-requested':order.returnStatus==='환불 완료'||order.returnStatus==='반품 반려'||order.status==='전체 취소'?' cancelled':'';}
function canCancel(o){return o.status==='출고 대기'&&!o.trackingNumber&&!o.returnStatus&&Date.now()<(o.cancelUntil||0);}
function carrierTrackingUrl(carrier,trackingNumber){const number=String(trackingNumber||'').replace(/[^0-9A-Za-z]/g,''),urls={'CJ대한통운':value=>`https://www.cjlogistics.com/ko/tool/parcel/newTracking?gnbInvcNo=${encodeURIComponent(value)}`,'한진택배':value=>`https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnum=${encodeURIComponent(value)}&wblnumText=`,'롯데택배':value=>`https://www.lotteglogis.com/home/reservation/tracking/invoiceView?InvNo=${encodeURIComponent(value)}`,'우체국택배':value=>`https://service.epost.go.kr/trace.RetrieveRegiPrclDeliv.postal?sid1=${encodeURIComponent(value)}`,'로젠택배':value=>`https://www.ilogen.com/web/personal/tkSearch?slipno=${encodeURIComponent(value)}`,'경동택배':value=>`https://kdexp.com/service/delivery/etc/delivery.do?barcode=${encodeURIComponent(value)}`,'대신택배':value=>`https://www.ds3211.co.kr/freight/internalFreightSearch.ht?billno=${encodeURIComponent(value)}`,'일양로지스':value=>`https://www.ilyanglogis.com/functionality/tracking_result.asp?hawb_no=${encodeURIComponent(value)}`,'천일택배':value=>`https://www.chunil.co.kr/HTrace/HTrace.jsp?transNo=${encodeURIComponent(value)}`,'합동택배':value=>`https://hdexp.co.kr/delivery_search.hd?barcode=${encodeURIComponent(value)}`,'CU 편의점택배':value=>`https://www.cupost.co.kr/postbox/delivery/localResult.cupost?invoice_no=${encodeURIComponent(value)}`,'GS Postbox':value=>`https://www.cvsnet.co.kr/invoice/tracking.do?invoice_no=${encodeURIComponent(value)}`,'DHL':value=>`https://www.dhl.com/kr-ko/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(value)}`,'FedEx':value=>`https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(value)}`,'UPS':value=>`https://www.ups.com/track?loc=ko_KR&tracknum=${encodeURIComponent(value)}`};if(urls[carrier])return urls[carrier](number);return `https://search.naver.com/search.naver?query=${encodeURIComponent(`${carrier||'택배'} ${number} 배송조회`)}`;}
function shipmentLookup(o){const url=carrierTrackingUrl(o.carrier,o.trackingNumber);return ['출고 완료','배송 완료'].includes(o.status)&&o.trackingNumber?`<div class="shipment-lookup"><a class="outline" href="${escapeText(url)}" target="_blank" rel="noopener noreferrer">배송조회 ↗</a><small>택배사와 송장번호가 입력된 조회 페이지가 열립니다.</small></div>`:'';}
function orderStatusLabel(o){return o.status==='출고 대기'?'배송 준비 중':o.status==='출고 완료'?'발송 완료':o.status==='전체 취소'?'취소 완료':o.status;}
function orderItemVisual(i){const p=products.find(p=>p.id===i.id);return p?.image?`<img src="${escapeText(p.image)}" alt="${escapeText(i.name)}" />`:`<span>${escapeText(p?.art||'GOODS')}</span>`;}
function orderPlacedAt(order){
 const timestamp=typeof order.createdAt==='number'?order.createdAt:Date.parse(order.createdAt||'');
 if(Number.isFinite(timestamp)&&timestamp>0)return timestamp;
 const match=String(order.date||'').match(/^(\d{4})[.\/-]\s*(\d{1,2})[.\/-]\s*(\d{1,2})/);
 if(match){const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));if(date.getFullYear()===Number(match[1])&&date.getMonth()===Number(match[2])-1&&date.getDate()===Number(match[3]))return date.getTime();}
 return 0;
}
function newestOrders(list){return [...list].sort((a,b)=>orderPlacedAt(b)-orderPlacedAt(a));}
