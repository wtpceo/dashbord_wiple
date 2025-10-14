// 숫자를 한국 통화 형식으로 포맷
export const formatCurrency = (value: number): string => {
  if (value >= 100000000) {
    // 1억 이상
    const billions = Math.floor(value / 100000000);
    const millions = Math.floor((value % 100000000) / 10000);
    if (millions > 0) {
      return `${billions}억 ${millions}만원`;
    }
    return `${billions}억원`;
  } else if (value >= 10000) {
    // 1만 이상
    const millions = Math.floor(value / 10000);
    const thousands = Math.floor((value % 10000) / 1000);
    if (thousands > 0) {
      return `${millions}만 ${thousands}천원`;
    }
    return `${millions}만원`;
  } else {
    return `${value.toLocaleString()}원`;
  }
};

// 퍼센트 포맷
export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// 증감율 계산
export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// 증감 표시 (+ 또는 - 포함)
export const formatGrowth = (current: number, previous: number): string => {
  const growth = calculateGrowthRate(current, previous);
  const sign = growth > 0 ? '+' : '';
  return `${sign}${formatPercent(growth)}`;
};

// Tailwind CSS 클래스 조합 헬퍼
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

