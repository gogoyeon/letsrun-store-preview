/* Shared real empty screens and a read-only keyboard preview. */
const EmptyStates = (() => {
  const states = {
    products: ['상품 목록', '준비 중인 상품입니다', '새로운 상품을 준비하고 있어요. 조금만 기다려 주세요.', 'box'],
    cart: ['장바구니', '장바구니가 비어 있어요', '마음에 드는 상품을 장바구니에 담아 보세요.', 'bag', '상품 둘러보기', 'shop'],
    orders: ['주문 내역', '아직 주문 내역이 없어요', '첫 주문을 하면 배송 상태와 주문 내역을 여기에서 확인할 수 있어요.', 'receipt', '상품 둘러보기', 'shop'],
    productMissing: ['상품 상세 · 상품 없음', '상품을 찾을 수 없어요', '판매가 종료되었거나 삭제된 상품입니다. 다른 상품을 둘러보세요.', 'box', '상품 목록으로', 'shop'],
    checkout: ['주문·결제 · 선택 상품 없음', '주문할 상품이 없어요', '선택한 상품이 없거나 판매 상태가 변경되었습니다. 상품을 다시 선택해 주세요.', 'bag', '상품 선택하기', 'shop'],
    orderMissing: ['주문 상세 · 주문 없음', '주문을 찾을 수 없어요', '주문 내역에서 확인할 주문을 다시 선택해 주세요.', 'receipt', '주문 내역으로', 'orders'],
    adminProducts: ['상품 관리 · 등록 상품 없음', '등록된 상품이 없습니다', '첫 상품을 등록하고 가격, 재고와 판매 상태를 관리해 보세요.', 'box', '상품 등록', 'add'],
    adminProductSearch: ['상품 관리 · 검색 결과 없음', '조건에 맞는 상품이 없습니다', '상품명이나 판매 상태를 변경하여 다시 검색해 주세요.', 'search', '검색 조건 초기화', 'resetProducts'],
    adminOrders: ['판매 현황 · 주문 없음', '접수된 주문이 없습니다', '고객이 주문하면 구매 정보와 결제 내역이 여기에 표시됩니다.', 'receipt'],
    adminOrderSearch: ['판매 현황 · 검색 결과 없음', '조건에 맞는 주문이 없습니다', '조회 기간이나 검색 조건을 변경하여 다시 확인해 주세요.', 'search', '검색 조건 초기화', 'resetOrders'],
    shippingPending: ['배송 처리 · 발송 대기 없음', '발송 대기 주문이 없습니다', '발송할 주문이 접수되면 운송장을 등록할 수 있습니다.', 'truck'],
    shippingDone: ['배송 처리 · 발송 완료 없음', '발송 완료 주문이 없습니다', '운송장을 등록한 주문이 여기에 표시됩니다.', 'truck'],
    settlement: ['매출·정산 · 내역 없음', '조회 기간의 정산 내역이 없습니다', '결제 승인과 취소·환불 내역이 생기면 정산 금액을 확인할 수 있습니다.', 'receipt']
  };
  const icons = {
    box: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 5v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5"/>',
    bag: '<path d="M5 8h14l1 13H4L5 8Zm3 0V6a4 4 0 0 1 8 0v2"/>',
    receipt: '<path d="M6 3h12v19l-3-2-3 2-3-2-3 2V3ZM9 8h6M9 12h6M9 16h3"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    truck: '<path d="M2 5h12v12H2V5Zm12 5h4l4 4v3h-8M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm11 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>'
  };
  const isAdmin = () => Boolean(document.getElementById('admin-main'));
  function html(key) {
    const [, title, description, icon, label, action] = states[key];
    return `<section class="empty-state" data-empty-state="${key}" aria-label="${title}"><div class="empty-state-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${icons[icon]}</svg></div><h2>${title}</h2><p>${description}</p>${action ? `<button type="button" class="empty-state-action" data-empty-action="${action}">${label}</button>` : ''}</section>`;
  }
  let preview, previousFocus;
  function close() { if (preview?.open) preview.close(); }
  function open() {
    if (!preview) {
      preview = document.createElement('dialog');
      preview.className = 'empty-preview';
      preview.setAttribute('aria-labelledby', 'emptyPreviewTitle');
      const keys = Object.keys(states).filter(key => isAdmin() ? key.startsWith('admin') || key.startsWith('shipping') || key === 'settlement' : !key.startsWith('admin') && !key.startsWith('shipping') && key !== 'settlement');
      preview.innerHTML = `<header class="empty-preview-header"><div><p>EMPTY STATES</p><h2 id="emptyPreviewTitle">${isAdmin() ? '관리자' : '사용자'} 빈 화면 미리보기</h2></div><button type="button" data-empty-close aria-label="미리보기 닫기">×</button></header><label class="empty-preview-select">화면 선택<select>${keys.map(key => `<option value="${key}">${states[key][0]}</option>`).join('')}</select></label><div class="empty-preview-stage"></div><p class="empty-preview-note">실제 데이터는 변경되지 않습니다. ⌥⌘E 또는 Esc로 닫을 수 있습니다.</p>`;
      document.body.append(preview);
      const select = preview.querySelector('select');
      const render = () => { preview.querySelector('.empty-preview-stage').innerHTML = html(select.value); };
      select.addEventListener('change', render);
      preview.querySelector('[data-empty-close]').addEventListener('click', close);
      preview.addEventListener('click', event => { if (event.target === preview) { const r = preview.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close(); } });
      preview.addEventListener('close', () => previousFocus?.focus());
      render();
    }
    previousFocus = document.activeElement;
    preview.showModal();
  }
  document.addEventListener('keydown', event => {
    if (event.altKey && (event.metaKey || event.ctrlKey) && (event.code === 'KeyE' || event.key.toLowerCase() === 'e')) {
      event.preventDefault(); if (!event.repeat) preview?.open ? close() : open();
    }
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-empty-action]');
    if (!button) return;
    close();
    const action = button.dataset.emptyAction;
    if (action === 'shop') { document.getElementById('cartPanel')?.classList.remove('open'); location.hash = 'products'; }
    if (action === 'orders') location.hash = 'orders';
    if (action === 'add') document.getElementById('addGoods')?.click();
    if (action === 'resetOrders') document.getElementById('resetFilters')?.click();
    if (action === 'resetProducts') { const form = document.getElementById('productFilter'); form?.reset(); form?.requestSubmit(); }
  });
  return { html, open, states };
})();
