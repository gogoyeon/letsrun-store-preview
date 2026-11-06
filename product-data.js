const sampleProducts = [
  {
    "id": 1,
    "name": "말마 인형",
    "description": "귀여운 말마 캐릭터 봉제 인형",
    "price": 29000,
    "stock": 18,
    "status": "sale",
    "order": 1,
    "art": "MALMA",
    "detailHtml": "<h3>말마 인형</h3><p>귀여운 말마 캐릭터 봉제 인형</p><p>스토어 화면과 구매 흐름을 확인하기 위한 샘플 상품입니다. 실제 판매 사양과 구성은 운영 시 확정됩니다.</p>"
  },
  {
    "id": 2,
    "name": "경주마 인형 A",
    "description": "경주마의 역동성을 담은 인형",
    "price": 26000,
    "stock": 9,
    "status": "sale",
    "order": 2,
    "art": "RACE A",
    "detailHtml": "<h3>경주마 인형 A</h3><p>경주마의 역동성을 담은 인형</p><p>스토어 화면과 구매 흐름을 확인하기 위한 샘플 상품입니다. 실제 판매 사양과 구성은 운영 시 확정됩니다.</p>"
  },
  {
    "id": 3,
    "name": "경주마 인형 B",
    "description": "컬렉션을 완성하는 한정 디자인",
    "price": 26000,
    "stock": 0,
    "status": "soldout",
    "order": 3,
    "art": "RACE B",
    "detailHtml": "<h3>경주마 인형 B</h3><p>컬렉션을 완성하는 한정 디자인</p><p>스토어 화면과 구매 흐름을 확인하기 위한 샘플 상품입니다. 실제 판매 사양과 구성은 운영 시 확정됩니다.</p>"
  },
  {
    "id": 4,
    "name": "말마 미니 인형",
    "description": "책상과 선반에 함께 두기 좋은 작은 말마 인형",
    "price": 18000,
    "stock": 30,
    "status": "sale",
    "order": 4,
    "art": "MINI MALMA",
    "detailHtml": "<h3>말마 미니 인형</h3><p>책상과 선반에 함께 두기 좋은 작은 말마 인형</p><p>스토어 화면과 구매 흐름을 확인하기 위한 샘플 상품입니다. 실제 판매 사양과 구성은 운영 시 확정됩니다.</p>"
  },
  {
    "id": 5,
    "name": "말마 인형 키링",
    "description": "가방에 달아 매일 함께하는 말마 봉제 키링",
    "price": 12000,
    "stock": 45,
    "status": "sale",
    "order": 5,
    "art": "MALMA KEY",
    "detailHtml": "<h3>말마 인형 키링</h3><p>가방에 달아 매일 함께하는 말마 봉제 키링</p><p>스토어 화면과 구매 흐름을 확인하기 위한 샘플 상품입니다. 실제 판매 사양과 구성은 운영 시 확정됩니다.</p>"
  },
  {
    "id": 6,
    "name": "경주마 미니 인형",
    "description": "작은 크기로 만나는 경주마 캐릭터 봉제 인형",
    "price": 16000,
    "stock": 24,
    "status": "sale",
    "order": 6,
    "art": "MINI RACE",
    "detailHtml": "<h3>경주마 미니 인형</h3><p>작은 크기로 만나는 경주마 캐릭터 봉제 인형</p><p>스토어 화면과 구매 흐름을 확인하기 위한 샘플 상품입니다. 실제 판매 사양과 구성은 운영 시 확정됩니다.</p>"
  },
  {
    "id": 7,
    "name": "말마 쿠션 인형",
    "description": "소파나 침대에 두기 좋은 포근한 말마 쿠션 인형",
    "price": 35000,
    "stock": 15,
    "status": "sale",
    "order": 7,
    "art": "MALMA HUG",
    "detailHtml": "<h3>말마 쿠션 인형</h3><p>소파나 침대에 두기 좋은 포근한 말마 쿠션 인형</p><p>스토어 화면과 구매 흐름을 확인하기 위한 샘플 상품입니다. 실제 판매 사양과 구성은 운영 시 확정됩니다.</p>"
  },
  {
    "id": 8,
    "name": "말마 인형 선물 세트",
    "description": "말마 인형과 봉제 키링을 함께 담은 선물 세트",
    "price": 39000,
    "stock": 12,
    "status": "sale",
    "order": 8,
    "art": "MALMA GIFT",
    "detailHtml": "<h3>말마 인형 선물 세트</h3><p>말마 인형과 봉제 키링을 함께 담은 선물 세트</p><p>스토어 화면과 구매 흐름을 확인하기 위한 샘플 상품입니다. 실제 판매 사양과 구성은 운영 시 확정됩니다.</p>"
  }
];
