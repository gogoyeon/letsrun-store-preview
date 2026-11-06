// Shared UI fixtures. Retire only our explicit demo IDs; preserve real orders and processing results.
const OrderDemoData = {
  seed(orders, now = Date.now()) {
    const hour = 3600000;
    // These variants changed only the reason/default amount, or represented a retired state.
    const retired = new Set(['RETURN-READY-DEFECT', 'RETURN-WAIT-WRONG', 'EXCEPTION-DEDUCT', 'RETURN-LEGACY-REJECT'].map(id => 'G-DEMO-' + id));
    for (let i = orders.length - 1; i >= 0; i--) {
      if (orders[i].demo === true && retired.has(orders[i].number)) orders.splice(i, 1);
    }
    const scenarios = [
      ['RETURN-READY-CHANGE', '반품 처리 가능', 'ready', '단순 변심'],
      ['RETURN-WAIT-CHANGE', '반품 송장 대기', 'waiting', '단순 변심'],
      ['RETURN-DONE-FULL', '반품 전액 환불 완료', 'returned', '상품 불량·파손', 0],
      ['RETURN-DONE-DEDUCT', '반품 차감 환불 완료', 'returned', '단순 변심', 6000],
      ['SHIP-PENDING', '배송 준비', 'pending'],
      ['LONG-NAME', '긴 상품명 수량 표시', 'pending'],
      ['SHIP-SENT', '발송 완료', 'shipped'],
      ['CANCELLED', '주문 취소 완료', 'cancelled'],
      ['EXCEPTION-FULL', '예외 환불 완료', 'exception', '', 0]
    ];
    // Update only generated captions, without resetting statuses, amounts or customer edits.
    for (const [id, label] of scenarios) {
      const saved = orders.find(order => order.number === 'G-DEMO-' + id && order.demo === true);
      if (saved && saved.name === '[예시] ' + saved.demoScenario) {
        saved.name = '[예시] ' + label;
        saved.demoScenario = label;
      }
    }
    const existing = new Set(orders.map(order => order.number));
    for (const [index, [id, label, state, reason, deduction]] of scenarios.entries()) {
      const number = 'G-DEMO-' + id;
      if (existing.has(number)) continue;
      const createdAt = now - (index + 1) * 60000;
      const order = {
        number, demo: true, demoScenario: label, name: '[예시] ' + label,
        recipient: '시연 고객', phone: '010-0000-0000', recipientPhone: '010-0000-0000',
        address: '경기도 과천시 경마공원대로 107, 시연 수령처',
        request: '개발 확인용 예시 주문입니다.',
        createdAt, approvedAt: createdAt, date: new Date(createdAt).toLocaleDateString('ko-KR'),
        cancelUntil: createdAt + 24 * hour,
        items: [{id: 2, name: '경주마 인형 A', price: 26000, qty: 2}],
        subtotal: 52000, shippingFee: 3000, total: 55000, inventoryApplied: false,
        status: '출고 대기', returnDays: 14,
        policySnapshot: {shippingFee: 3000, cancelHours: 24, returnDays: 14, returnShippingFee: 6000}
      };
      if (id === 'LONG-NAME') Object.assign(order, {
        items: [{id: 2, name: '[샘플] 경주마 인형 1'.repeat(8), price: 6500, qty: 1, discountQty: 1}],
        subtotal: 6500, discountAmount: 6000, shippingFee: 3000, total: 3500,
        discountSnapshot: {name: '테스트 1', type: 'fixed', value: 6000}
      });
      if (!['pending', 'cancelled'].includes(state)) {
        Object.assign(order, {status: '출고 완료', carrier: 'CJ대한통운',
          trackingNumber: '00000000' + String(index + 1).padStart(4, '0'), shippedAt: createdAt + 1000});
      }
      if (['ready', 'waiting', 'returned'].includes(state)) {
        Object.assign(order, {returnStatus: '신청 완료', returnReason: reason,
          returnDetail: '개발 확인용 전체 반품 예시입니다.', returnMethod: '고객 직접 반송(착불)',
          returnRequestedAt: createdAt + 2000});
        if (state !== 'waiting') Object.assign(order, {returnCarrier: 'CJ대한통운',
          returnTrackingNumber: '00000001' + String(index + 1).padStart(4, '0')});
      }
      if (state === 'cancelled') Object.assign(order, {
        status: '전체 취소', cancelCompletedAt: createdAt + 3000, adminCancelReason: '시연용 발송 전 전체 취소'
      });
      if (state === 'returned' || state === 'exception') {
        Object.assign(order, {returnStatus: '환불 완료', shippingDeduction: deduction,
          refundAmount: order.total - deduction, refundCompletedAt: createdAt + 3000,
          customerRefundNote: deduction ? '반품 배송비 6,000원을 차감하여 49,000원을 환불했습니다.' : '결제금액 55,000원을 전액 환불했습니다.'});
        if (state === 'exception') Object.assign(order, {
          refundKind: '관리자 예외 환불', exceptionalRefundReason: '시연용 고객 협의에 따른 예외 환불'
        });
        else {
          order.refundDecision = {shippingTreatment: deduction ? 'deduct' : 'none',
            defaultShippingTreatment: deduction ? 'deduct' : 'none',
            shippingDeduction: deduction, defaultShippingDeduction: deduction, overridden: false,
            overrideReason: '', processedBy: '시연 관리자', processedAt: order.refundCompletedAt,
            locked: true, correctionRoute: 'EXTERNAL_CUSTOMER_CENTER_PHONE'};
          order.refundHistory = [{...order.refundDecision}];
        }
      }
      orders.push(order);
    }
    return orders;
  }
};
