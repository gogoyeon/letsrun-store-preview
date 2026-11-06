// Each product stores its balance and append-only stock movements together.
const Inventory = {
  validateStatus(status, stock) {
    if (status === 'sale' && !(Number(stock) > 0)) throw new Error('재고가 0개인 상품은 판매 중으로 변경할 수 없습니다. 재고를 먼저 추가해 주세요.');
  },
  adminActor() {
    // Use the same login ID as the shared reservation admin session.
    const loginId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('letsrunPlayAdminSessionV1') : null;
    if (loginId === 'signed-out') throw new Error('관리자 로그인 후 다시 시도해 주세요.');
    return loginId || 'admin'; // Reservation prototype's default demo account.
  },
  actorLabel(entry) {
    // Legacy prototype entries were made before account IDs were recorded.
    if (!entry.actor || ['시스템', '운영 관리자'].includes(entry.actor)) return 'admin';
    return entry.actor;
  },
  history(product) {
    if (!product.stockHistory) {
      product.stockHistory = [{at: product.createdAt || Date.now(), delta: Number(product.stock), balance: Number(product.stock), reason: '기존 재고 기준 등록', actor: this.adminActor()}];
    }
    // Record the actual time this undated opening balance is registered, not a guessed past date.
    product.stockHistory.forEach(entry => {
      if (!entry.at) {
        entry.at = Date.now();
        entry.reason = '기존 재고 기준 등록';
        entry.actor = this.adminActor();
      }
    });
    return product.stockHistory;
  },
  change(product, delta, reason, actor = this.adminActor(), reference = '') {
    if (!Number.isSafeInteger(delta) || !delta || !reason.trim()) throw new Error('수량과 사유를 입력해 주세요.');
    const balance = Number(product.stock) + delta;
    if (!Number.isSafeInteger(balance) || balance < 0) throw new Error('현재 재고보다 많은 수량을 차감할 수 없습니다.');
    const history = this.history(product);
    if (reference && history.some(entry => entry.reference === reference)) return;
    product.stockHistory = [...history, {at: Date.now(), delta, balance, reason: reason.trim(), actor, reference}];
    product.stock = balance;
    if (!balance && product.status === 'sale') product.status = 'soldout';
  }
};
