// Shared checkout copy defaults. Notices are displayed as plain text.
const CheckoutContent = {
  consent: Object.freeze({
    purchaseText: "구매 전 확인사항을 확인하고 동의합니다.",
    privacyText: "주문 및 배송을 위한 개인정보 수집·이용에 동의합니다.",
    purchaseVersion: "purchase-consent-v1",
    privacyVersion: "privacy-order-v1"
  }),
  defaults: {
    shippingNotice: '매주 목요일에 주 1회 일괄 발송합니다. 지난주 토요일까지 접수된 주문이 발송 대상이며, 일요일 이후 접수된 주문은 다음 주 목요일에 발송됩니다.',
    purchaseNoticesFormat: 'plain-text-v1',
    purchaseNoticesText: '상품과 수량, 배송지 정보를 확인해 주세요. 결제 시 재고가 부족하면 구매할 수 없습니다.\n매주 목요일에 주 1회 일괄 발송합니다. 지난주 토요일까지 접수된 주문이 발송 대상이며, 일요일 이후 접수된 주문은 다음 주 목요일에 발송됩니다.\n배송비는 주문당 3,000원입니다.\n결제 후 24시간 이내, 운송장 등록 전까지 주문 전체 취소 및 전액 환불이 가능합니다.\n운송장 등록 후 14일 이내 주문 전체 반품을 신청할 수 있습니다. 불량·오배송 등 법정 예외는 고객센터로 문의해 주세요.',
    purchaseAgreementText: '구매·배송·취소·반품 조건을 확인하고 동의합니다.',
    privacyAgreementText: '주문 및 배송을 위한 개인정보 수집·이용에 동의합니다.',
    purchasePolicyVersion: 'commerce-policy-v1',
    privacyPolicyVersion: 'privacy-order-v1'
  },
  migrateShippingSettings(settings) {
    const legacy = [
      '직전 주 토요일까지 접수된 주문은 매주 목요일에 일괄 발송됩니다.',
      '주 1회 모아서 발송합니다. 이번 주 주문 마감과 발송일은 렛츠런플레이 상품 상세 안내를 확인해 주세요.',
      '주 1회 모아서 발송합니다. 주간 마감과 발송일은 렛츠런플레이 상품 상세 안내를 확인해 주세요.'
    ];
    return {...settings,
      shippingNotice: legacy.includes(settings.shippingNotice) ? this.defaults.shippingNotice : settings.shippingNotice,
      purchaseNoticesText: typeof settings.purchaseNoticesText === 'string'
        ? settings.purchaseNoticesText.replace('주 1회 모아서 발송합니다. 주문 마감과 발송일은 상품 상세 안내를 확인해 주세요.', this.defaults.shippingNotice).replace('직전 주 토요일까지 접수된 주문은 매주 목요일에 일괄 발송됩니다.', this.defaults.shippingNotice)
        : settings.purchaseNoticesText
    };
  },
  nextOrderNumber(timestamp, existingOrders = []) {
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Seoul', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(new Date(timestamp));
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const day = values.year.slice(-2) + values.month + values.day;
    const sequenceKey = 'goodsOrderSequence:' + day;
    const storedOrders = JSON.parse(localStorage.goodsOrders || '[]');
    const prefix = 'G-' + day + '-';
    const previous = Math.max(Number(localStorage.getItem(sequenceKey)) || 0, ...[...storedOrders, ...existingOrders].map(order => {
      const suffix = String(order.number || '').startsWith(prefix) ? String(order.number).slice(prefix.length) : '';
      return /^\d+$/.test(suffix) ? Number(suffix) : 0;
    }));
    const next = previous + 1;
    if (next > 99999) throw new Error('오늘 발급 가능한 주문번호를 초과했습니다.');
    localStorage.setItem(sequenceKey, String(next));
    return prefix + String(next).padStart(5, '0');
  },
  // One-time conversion of previously saved templates; new input stays literal.
  migrateLegacySettings(settings) {
    if (settings.purchaseNoticesFormat === 'plain-text-v1') return settings;
    const values = {'배송안내': settings.shippingNotice ?? '매주 목요일에 주 1회 일괄 발송합니다. 지난주 토요일까지 접수된 주문이 발송 대상이며, 일요일 이후 접수된 주문은 다음 주 목요일에 발송됩니다.', '배송비': Number(settings.shippingFee ?? 3000).toLocaleString('ko-KR') + '원', '취소시간': settings.cancelHours ?? 24, '반품기간': settings.returnDays ?? 14};
    return {...settings, purchaseNoticesFormat: 'plain-text-v1', ...(typeof settings.purchaseNoticesText === 'string' ? {purchaseNoticesText: settings.purchaseNoticesText.replace(/\{(배송안내|배송비|취소시간|반품기간)\}/g, (token, key) => values[key] == null ? token : values[key])} : {})};
  }
};

// Preserve custom legacy copy while removing saved template tokens once.
if (localStorage.goodsSettings) {
  const savedSettings = JSON.parse(localStorage.goodsSettings);
  if (savedSettings.purchaseNoticesFormat !== 'plain-text-v1') {
    localStorage.goodsSettings = JSON.stringify(CheckoutContent.migrateLegacySettings(savedSettings));
  }
}
