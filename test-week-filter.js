// 주차 → 월 변환 테스트
function getMonthFromWeek(weekString) {
  const match = weekString.match(/^(\d{4})-W(\d{1,2})$/);
  if (!match) return '';

  const year = parseInt(match[1]);
  const week = parseInt(match[2]);

  const jan1 = new Date(year, 0, 1);
  const daysToFirstThursday = (11 - jan1.getDay()) % 7;
  const thursday = new Date(year, 0, 1 + daysToFirstThursday + (week - 1) * 7);

  return `${thursday.getFullYear()}-${String(thursday.getMonth() + 1).padStart(2, '0')}`;
}

function isCurrentMonthReport(weekString, currentMonth) {
  if (!weekString) return false;
  const reportMonth = getMonthFromWeek(weekString);
  return reportMonth === currentMonth;
}

// 현재 월
const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

console.log('🧪 주차 → 월 변환 테스트\n');
console.log(`현재 월: ${currentMonth}\n`);

// 테스트 케이스
const testCases = [
  '2025-W42',
  '2025-W41',
  '2025-W43',
  '2025-W01',
  '2025-W52',
];

testCases.forEach(weekString => {
  const month = getMonthFromWeek(weekString);
  const isCurrentMonth = isCurrentMonthReport(weekString, currentMonth);
  console.log(`${weekString} → ${month} ${isCurrentMonth ? '✅ 이번 달' : '❌ 다른 달'}`);
});

console.log('\n💡 복구된 데이터가 "2025-W42"라면:');
console.log(`   → 월: ${getMonthFromWeek('2025-W42')}`);
console.log(`   → 현재 월과 일치: ${isCurrentMonthReport('2025-W42', currentMonth) ? '✅ 예' : '❌ 아니오'}`);
