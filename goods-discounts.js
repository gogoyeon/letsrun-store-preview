// Shared merchandise discount rules. Browser demo storage; production must validate on server.
const GoodsDiscounts = {
 key: 'goodsDiscountsV1',
 promoDemoSeedKey: 'goodsPromoCodeDemo20261102',
 demoSeedKey: 'goodsPublicDiscountDemo20261102',
 defaults(){return [
  {id:'demo-public-percent-20261102',mode:'public',name:'굿즈 10% 할인',type:'percent',value:10,maxQty:10,noticeText:'상품 1개당 10% 할인',startDate:'2026-11-02',endDate:'2027-12-31',allProducts:true,active:true,productIds:[],demo:true},
  {id:'demo-public-fixed-20261102',mode:'public',name:'굿즈 3,000원 할인',type:'fixed',value:3000,maxQty:10,noticeText:'상품 1개당 3,000원 할인',startDate:'2026-11-02',endDate:'2027-12-31',allProducts:true,active:true,productIds:[],demo:true}
 ];},
 read(){
  try{
   const saved=localStorage.getItem(this.key);
   const rows=saved===null?[]:JSON.parse(saved);
   if(!Array.isArray(rows))return [];
   // Seed once per browser without replacing edited policies or resurrecting deleted demos.
   if(localStorage.getItem(this.demoSeedKey)!=='1'){
    const ids=new Set(rows.map(d=>d.id));
    rows.push(...this.defaults().filter(d=>!ids.has(d.id)));
    localStorage.setItem(this.key,JSON.stringify(rows));
    localStorage.setItem(this.demoSeedKey,'1');
   }
   if(localStorage.getItem(this.promoDemoSeedKey)!=='1'){
    const code='MALMA2026',id='demo-code-malma2026';
    if(!rows.some(d=>d.id===id||(d.mode==='code'&&this.normalizeCode(d.code)===code))){
     rows.push({id,mode:'code',code,name:'말마 프로모션',type:'fixed',value:3000,maxQty:10,noticeText:'상품 1개당 3,000원 할인',startDate:'2026-11-02',endDate:'2027-12-31',allProducts:true,active:true,productIds:[],demo:true});
     localStorage.setItem(this.key,JSON.stringify(rows));
    }
    localStorage.setItem(this.promoDemoSeedKey,'1');
   }
   const previousCopy={
    'demo-public-percent-20261102':['[시연] 굿즈 10% 할인','굿즈 10% 할인','일반 할인 선택을 확인하기 위한 시연용 할인입니다.','상품 1개당 10% 할인'],
    'demo-public-fixed-20261102':['[시연] 굿즈 3,000원 할인','굿즈 3,000원 할인','상품 1개당 3,000원 할인 · 시연용','상품 1개당 3,000원 할인'],
    'demo-code-malma2026':['[시연] 말마 프로모션','말마 프로모션','상품 1개당 3,000원 할인 · 계정당 1회 · 시연용','상품 1개당 3,000원 할인']
   };
   let copyChanged=false;
   for(const row of rows){
    if(row.mode==='code'&&'maxUses' in row){
     row.maxQty=row.maxQty||(row.id==='demo-code-malma2026'?10:1);
     delete row.maxUses;
     copyChanged=true;
    }
    if(row.id==='demo-code-malma2026'&&row.noticeText==='상품 1개당 3,000원 할인 · 계정당 1회'){
     row.noticeText='상품 1개당 3,000원 할인';copyChanged=true;
    }
    const copy=previousCopy[row.id];if(!copy)continue;
    if(row.name===copy[0]){row.name=copy[1];copyChanged=true;}
    if(row.noticeText===copy[2]){row.noticeText=copy[3];copyChanged=true;}
   }
   if(copyChanged)localStorage.setItem(this.key,JSON.stringify(rows));
   return rows;
  }catch{return [];}
 },
 day(now=Date.now()){return new Date(now+9*3600000).toISOString().slice(0,10);},
 normalizeCode(value){return String(value||'').trim().toUpperCase();},
 validate(d,policies=[]){
  if(!String(d.name||'').trim())return '할인명을 입력해 주세요.';
  if(!['fixed','percent'].includes(d.type)||!Number.isFinite(d.value)||d.value<=0|| (d.type==='percent'&&d.value>100)||(d.type==='fixed'&&!Number.isInteger(d.value)))return '정액은 1원 이상 정수, 정률은 0% 초과 100% 이하로 입력해 주세요.';
  if(d.mode==='code'){
   if(!/^[A-Z0-9]{4,24}$/.test(this.normalizeCode(d.code)))return '코드는 영문·숫자 4~24자로 입력해 주세요.';
   if(policies.some(x=>x.id!==d.id&&x.mode==='code'&&this.normalizeCode(x.code)===this.normalizeCode(d.code)))return '이미 등록된 프로모션 코드입니다.';
  }
  if(!Number.isSafeInteger(d.maxQty)||d.maxQty<1)return '최대 적용 수량은 1개 이상 정수로 입력해 주세요.';
  if(!d.startDate||!d.endDate||d.startDate>d.endDate)return '시작일과 종료일을 확인해 주세요.';
  if(!d.allProducts&&!d.productIds?.length)return '적용할 굿즈를 하나 이상 선택해 주세요.';
  return '';
 },
 status(d,now=Date.now()){const today=this.day(now);return !d.active?'비활성':today<d.startDate?'예정':today>d.endDate?'종료':'활성';},
 usedQty(d,accountId,orders=[]){
  if(!accountId)return 0;
  return orders.filter(o=>o.accountId===accountId&&o.discountSnapshot?.id===d.id&&o.status!=='전체 취소'&&o.returnStatus!=='환불 완료').reduce((sum,o)=>sum+(o.discountAllocations||o.items||[]).reduce((n,x)=>n+Math.max(0,Number(o.discountAllocations?x.qty:x.discountQty)||0),0),0);
 },
 applyCode(code,items,products,now=Date.now(),context={}){
  const normalized=this.normalizeCode(code),policy=this.read().find(d=>d.mode==='code'&&this.normalizeCode(d.code)===normalized);
  if(!policy||this.status(policy,now)!=='활성')return {error:'사용할 수 없는 코드입니다. 코드와 사용 기간을 확인해 주세요.'};
  if(!context.accountId)return {error:'로그인 후 코드를 사용할 수 있습니다.'};
  if(this.remainingQty(policy,context)===0)return {error:'이 코드의 계정당 적용 수량을 모두 사용했습니다.'};
  const quote=this.quote(policy.id,items,products,now,{...context,promoCode:normalized});
  return quote.amount?{...quote,code:normalized}:{error:'현재 주문에 적용할 수 없는 코드입니다. 대상 상품을 확인해 주세요.'};
 },
 remainingQty(d,context={}){return Math.max(0,d.maxQty-this.usedQty(d,context.accountId,context.orders));},
 calculate(d,items,products,now=Date.now(),context={}){
  const empty={amount:0,allocations:[]};
  if(!d||this.validate(d)||this.status(d,now)!=='활성')return empty;
  if(d.mode==='code'&&(!context.accountId||this.normalizeCode(context.promoCode)!==this.normalizeCode(d.code)))return empty;
  let remaining=this.remainingQty(d,context);
  const candidates=items.map((item,index)=>{const product=products.find(p=>p.id===item.id);if(!product||(!d.allProducts&&!d.productIds.includes(product.id))||!Number.isSafeInteger(item.qty)||item.qty<1)return null;
   const unit=Math.min(product.price,Math.floor(d.type==='percent'?product.price*d.value/100:d.value));return {id:item.id,index,qty:item.qty,unit};
  }).filter(x=>x&&x.unit>0).sort((a,b)=>b.unit-a.unit||a.index-b.index);
  const allocations=[];for(const x of candidates){const qty=Math.min(remaining,x.qty);if(qty>0){allocations.push({id:x.id,qty,unitDiscount:x.unit,amount:x.unit*qty});remaining-=qty;}}
  return {amount:allocations.reduce((s,x)=>s+x.amount,0),allocations};
 },
 quote(id,items,products,now=Date.now(),context={}){
  const policy=this.read().find(d=>d.id===id),result=this.calculate(policy,items,products,now,context);
  return {...result,policy:result.amount?JSON.parse(JSON.stringify(policy)):null};
 }
};
