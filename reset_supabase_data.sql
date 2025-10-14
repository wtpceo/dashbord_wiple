-- 먼저 기존 데이터 삭제
DELETE FROM dashboard_data WHERE id = 'default';

-- 새로운 초기 데이터 삽입
INSERT INTO dashboard_data (id, data, updated_at) VALUES (
  'default',
  '{
    "targetRevenue": 300000000,
    "lastMonthRevenue": {
      "total": 245000000,
      "byChannel": [
        {"channel": "토탈 마케팅", "value": 95000000},
        {"channel": "퍼포먼스", "value": 80000000},
        {"channel": "배달관리", "value": 45000000},
        {"channel": "브랜드블로그", "value": 25000000}
      ]
    },
    "currentMonthRevenue": {
      "total": 0,
      "byChannel": [
        {"channel": "토탈 마케팅", "value": 0},
        {"channel": "퍼포먼스", "value": 0},
        {"channel": "배달관리", "value": 0},
        {"channel": "브랜드블로그", "value": 0}
      ]
    },
    "totalClients": {
      "total": 0,
      "byChannel": [
        {"channel": "토탈 마케팅", "value": 0},
        {"channel": "퍼포먼스", "value": 0},
        {"channel": "배달관리", "value": 0},
        {"channel": "브랜드블로그", "value": 0}
      ]
    },
    "nextMonthExpiring": {
      "total": 0,
      "byChannel": [
        {"channel": "토탈 마케팅", "value": 0},
        {"channel": "퍼포먼스", "value": 0},
        {"channel": "배달관리", "value": 0},
        {"channel": "브랜드블로그", "value": 0}
      ]
    },
    "currentMonthExpiring": {
      "total": 0,
      "byChannel": [
        {"channel": "토탈 마케팅", "value": 0},
        {"channel": "퍼포먼스", "value": 0},
        {"channel": "배달관리", "value": 0},
        {"channel": "브랜드블로그", "value": 0}
      ]
    },
    "lastMonthRenewal": {
      "count": 32,
      "revenue": 89000000,
      "rate": 78.5,
      "byChannel": [
        {"channel": "토탈 마케팅", "count": 12, "revenue": 35000000, "rate": 80.0},
        {"channel": "퍼포먼스", "count": 10, "revenue": 28000000, "rate": 76.9},
        {"channel": "배달관리", "count": 7, "revenue": 18000000, "rate": 77.8},
        {"channel": "브랜드블로그", "count": 3, "revenue": 8000000, "rate": 75.0}
      ]
    },
    "currentMonthRenewal": {
      "count": 0,
      "revenue": 0,
      "rate": 0,
      "byChannel": [
        {"channel": "토탈 마케팅", "count": 0, "revenue": 0, "rate": 0},
        {"channel": "퍼포먼스", "count": 0, "revenue": 0, "rate": 0},
        {"channel": "배달관리", "count": 0, "revenue": 0, "rate": 0},
        {"channel": "브랜드블로그", "count": 0, "revenue": 0, "rate": 0}
      ]
    },
    "lastMonthNewClients": {
      "total": 18,
      "byChannel": [
        {"channel": "토탈 마케팅", "value": 6},
        {"channel": "퍼포먼스", "value": 7},
        {"channel": "배달관리", "value": 3},
        {"channel": "브랜드블로그", "value": 2}
      ]
    },
    "currentMonthNewClients": {
      "total": 0,
      "byChannel": [
        {"channel": "토탈 마케팅", "value": 0},
        {"channel": "퍼포먼스", "value": 0},
        {"channel": "배달관리", "value": 0},
        {"channel": "브랜드블로그", "value": 0}
      ]
    },
    "aeData": [
      {"name": "이수빈", "clientCount": 35, "weeklyReports": []},
      {"name": "최호천", "clientCount": 32, "weeklyReports": []},
      {"name": "조아라", "clientCount": 31, "weeklyReports": []},
      {"name": "정우진", "clientCount": 30, "weeklyReports": []},
      {"name": "김민우", "clientCount": 28, "weeklyReports": []},
      {"name": "양주미", "clientCount": 27, "weeklyReports": []}
    ],
    "salesData": [
      {"name": "박현수", "weeklyReports": []},
      {"name": "박은수", "weeklyReports": []}
    ]
  }'::jsonb,
  NOW()
);

-- 데이터 확인
SELECT id, jsonb_pretty(data) as data, updated_at FROM dashboard_data;