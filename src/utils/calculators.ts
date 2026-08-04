import { 
  SalaryInput, 
  SalaryResult, 
  BmiInput, 
  BmiResult, 
  SeveranceInput, 
  SeveranceResult, 
  VatInput, 
  VatResult, 
  ElectricityInput, 
  ElectricityResult, 
  ExchangeInput, 
  ExchangeResult, 
  CurrencyRate 
} from '../types';

// ==========================================
// 1. 연봉 실수령액 계산기
// ==========================================
export function calculateSalary(input: SalaryInput): SalaryResult {
  const grossAnnual = input.salaryType === 'annual' ? input.amount : input.amount * 12;
  const grossMonthly = Math.round(grossAnnual / 12);
  const nonTaxableMonthly = Math.min(input.nonTaxable, grossMonthly);
  const taxableMonthly = Math.max(0, grossMonthly - nonTaxableMonthly);

  // 1. 국민연금 (4.5%, 월 상한액 6,170,000원 -> 최대 277,650원)
  const pensionCappedIncome = Math.min(grossMonthly, 6170000);
  const nationalPension = Math.floor((pensionCappedIncome * 0.045) / 10) * 10;

  // 2. 건강보험 (3.545%)
  const healthInsurance = Math.floor((grossMonthly * 0.03545) / 10) * 10;

  // 3. 장기요양보험 (건강보험료의 12.95%)
  const longTermCare = Math.floor((healthInsurance * 0.1295) / 10) * 10;

  // 4. 고용보험 (0.9%)
  const employmentInsurance = Math.floor((grossMonthly * 0.009) / 10) * 10;

  const totalSocialInsurance = nationalPension + healthInsurance + longTermCare + employmentInsurance;

  // 5. 근로소득세 (간이세액표 모의 알고리즘)
  // 과세표준 월소득 및 부양가족 수 공제
  const dependents = Math.max(1, input.dependents);
  const childrenBonus = input.childrenUnder20 * 15000; // 자녀 공제 가산액

  let baseIncomeTax = 0;
  if (taxableMonthly <= 1060000) {
    baseIncomeTax = 0;
  } else if (taxableMonthly <= 2000000) {
    baseIncomeTax = (taxableMonthly - 1060000) * 0.03;
  } else if (taxableMonthly <= 3000000) {
    baseIncomeTax = 28200 + (taxableMonthly - 2000000) * 0.06;
  } else if (taxableMonthly <= 4000000) {
    baseIncomeTax = 88200 + (taxableMonthly - 3000000) * 0.11;
  } else if (taxableMonthly <= 6000000) {
    baseIncomeTax = 198200 + (taxableMonthly - 4000000) * 0.18;
  } else if (taxableMonthly <= 10000000) {
    baseIncomeTax = 558200 + (taxableMonthly - 6000000) * 0.24;
  } else {
    baseIncomeTax = 1518200 + (taxableMonthly - 10000000) * 0.32;
  }

  // 부양가족 감면 적용
  const familyDeduction = (dependents - 1) * 12000 + childrenBonus;
  const incomeTax = Math.max(0, Math.floor((baseIncomeTax - familyDeduction) / 10) * 10);

  // 6. 지방소득세 (근로소득세의 10%)
  const localIncomeTax = Math.floor((incomeTax * 0.1) / 10) * 10;

  const totalTax = incomeTax + localIncomeTax;
  const totalDeduction = totalSocialInsurance + totalTax;

  const netMonthlyPay = grossMonthly - totalDeduction;
  const netAnnualPay = netMonthlyPay * 12;

  const deductionRatio = grossMonthly > 0 ? Number(((totalDeduction / grossMonthly) * 100).toFixed(1)) : 0;

  return {
    grossMonthly,
    grossAnnual,
    nonTaxableMonthly,
    taxableMonthly,
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    totalSocialInsurance,
    incomeTax,
    localIncomeTax,
    totalTax,
    totalDeduction,
    netMonthlyPay,
    netAnnualPay,
    deductionRatio,
  };
}

// ==========================================
// 2. BMI 체질량지수 계산기
// ==========================================
export function calculateBmi(input: BmiInput): BmiResult {
  const heightM = input.heightCm / 100;
  const bmiRaw = input.weightKg / (heightM * heightM);
  const bmi = Number(bmiRaw.toFixed(1));

  let status: BmiResult['status'] = '정상';
  let statusColor = '#10B981'; // Green
  let healthTip = '';

  if (bmi < 18.5) {
    status = '저체중';
    statusColor = '#3B82F6'; // Blue
    healthTip = '균형 잡힌 영양 섭취와 규칙적인 근력 운동을 통해 적정 체중을 유지하는 것이 좋습니다.';
  } else if (bmi < 23.0) {
    status = '정상';
    statusColor = '#10B981'; // Green
    healthTip = '매우 건강한 BMI 범위입니다! 현재의 식습관과 운동 습관을 꾸준히 유지해 보세요.';
  } else if (bmi < 25.0) {
    status = '과체중';
    statusColor = '#F59E0B'; // Yellow/Amber
    healthTip = '과체중 단계입니다. 정제 탄수화물을 줄이고 유산소 운동량을 늘려 관리하는 것을 추천합니다.';
  } else if (bmi < 30.0) {
    status = '경도비만';
    statusColor = '#F97316'; // Orange
    healthTip = '경도비만 단계입니다. 혈압 및 혈당 관리에 신경 써주시고, 꾸준한 식단 조절이 권장됩니다.';
  } else if (bmi < 35.0) {
    status = '중정도비만';
    statusColor = '#EF4444'; // Red
    healthTip = '중정도비만 단계입니다. 전문가와의 상담을 통해 체계적인 체중 감량 플랜을 세우는 것이 안전합니다.';
  } else {
    status = '고도비만';
    statusColor = '#991B1B'; // Dark Red
    healthTip = '고도비만 단계입니다. 만성질환 예방을 위해 의학적 도움 및 전문적인 체중 관리가 시급합니다.';
  }

  // 표준 체중 계산 (남성: heightM^2 * 22, 여성: heightM^2 * 21)
  const factor = input.gender === 'male' ? 22 : 21;
  const idealWeight = Number((heightM * heightM * factor).toFixed(1));
  const idealWeightMin = Number((heightM * heightM * 18.5).toFixed(1));
  const idealWeightMax = Number((heightM * heightM * 22.9).toFixed(1));

  let weightDiffToNormal = 0;
  if (input.weightKg > idealWeightMax) {
    weightDiffToNormal = Number((input.weightKg - idealWeightMax).toFixed(1));
  } else if (input.weightKg < idealWeightMin) {
    weightDiffToNormal = Number((idealWeightMin - input.weightKg).toFixed(1));
  }

  // 기초대사량 미식 추정 (Mifflin-St Jeor Formula)
  let bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  bmr += input.gender === 'male' ? 5 : -161;
  const calorieEstimate = Math.round(bmr * 1.375); // 보통 활동 수준

  return {
    bmi,
    status,
    statusColor,
    idealWeightMin,
    idealWeightMax,
    weightDiffToNormal,
    calorieEstimate,
    healthTip,
  };
}

// ==========================================
// 3. 퇴직금 계산기
// ==========================================
export function calculateSeverance(input: SeveranceInput): SeveranceResult {
  const start = new Date(input.joinDate);
  const end = new Date(input.retireDate);

  // 총 근속일수 계산
  const timeDiff = end.getTime() - start.getTime();
  const totalWorkDays = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)) + 1);
  const yearsOfService = Number((totalWorkDays / 365).toFixed(2));

  // 최근 3개월 통상임금
  const threeMonthSalaryTotal = input.month1Salary + input.month2Salary + input.month3Salary;

  // 연간 상여금 & 연차수당의 3/12 배분
  const bonusForThreeMonths = (input.annualBonus * 3) / 12;
  const leavePayForThreeMonths = (input.annualLeavePay * 3) / 12;

  const totalWageForThreeMonths = threeMonthSalaryTotal + bonusForThreeMonths + leavePayForThreeMonths;

  // 3개월간의 총 일수 (대략 92일 기준으로 계산 또는 90~92일)
  const totalDaysInThreeMonths = 92;
  const averageDailyWage = Math.round(totalWageForThreeMonths / totalDaysInThreeMonths);

  // 예상 퇴직금 = 1일 평균임금 × 30일 × (재직일수 / 365)
  const estimatedSeverance = Math.round(averageDailyWage * 30 * (totalWorkDays / 365));

  return {
    totalWorkDays,
    yearsOfService,
    threeMonthSalaryTotal,
    bonusForThreeMonths,
    leavePayForThreeMonths,
    totalWageForThreeMonths,
    averageDailyWage,
    estimatedSeverance,
  };
}

// ==========================================
// 4. 부가세 계산기 (VAT)
// ==========================================
export function calculateVat(input: VatInput): VatResult {
  const rate = input.vatRate / 100;
  
  if (input.mode === 'fromSupply') {
    const supplyValue = Math.round(input.amount);
    const vatAmount = Math.round(supplyValue * rate);
    const totalAmount = supplyValue + vatAmount;
    return { supplyValue, vatAmount, totalAmount };
  } else {
    const totalAmount = Math.round(input.amount);
    const supplyValue = Math.round(totalAmount / (1 + rate));
    const vatAmount = totalAmount - supplyValue;
    return { supplyValue, vatAmount, totalAmount };
  }
}

// ==========================================
// 5. 전기요금 계산기 (한국전력 주택용)
// ==========================================
export function calculateElectricity(input: ElectricityInput): ElectricityResult {
  const usage = Math.max(0, input.usageKwh);
  const isSummer = input.season === 'summer';
  const isHigh = input.contractType === 'highVoltage';

  // 구간 단가표 (2025/2026 한전 표준)
  let tier1Limit = isSummer ? 300 : 200;
  let tier2Limit = isSummer ? 450 : 400;

  // 기본요금 (원)
  let base1 = isHigh ? 730 : 910;
  let base2 = isHigh ? 1260 : 1600;
  let base3 = isHigh ? 6010 : 7300;

  // 전력량 요금 (원/kWh)
  let rate1 = isHigh ? 105.0 : 120.0;
  let rate2 = isHigh ? 174.4 : 214.6;
  let rate3 = isHigh ? 242.3 : 307.3;

  let tier: 1 | 2 | 3 = 1;
  let tierName = '1단계 (알뜰 구간)';
  let baseRate = base1;
  let energyCharge = 0;

  if (usage <= tier1Limit) {
    tier = 1;
    tierName = `1단계 (${tier1Limit}kWh 이하)`;
    baseRate = base1;
    energyCharge = usage * rate1;
  } else if (usage <= tier2Limit) {
    tier = 2;
    tierName = `2단계 (${tier1Limit + 1}~${tier2Limit}kWh)`;
    baseRate = base2;
    energyCharge = tier1Limit * rate1 + (usage - tier1Limit) * rate2;
  } else {
    tier = 3;
    tierName = `3단계 (${tier2Limit}kWh 초과 - 누진 적용)`;
    baseRate = base3;
    energyCharge = tier1Limit * rate1 + (tier2Limit - tier1Limit) * rate2 + (usage - tier2Limit) * rate3;
  }

  // 기후환경요금 (9원/kWh)
  const climateCharge = usage * 9.0;

  // 연료비조정액 (기본 +5원/kWh)
  const fuelAdjustmentCharge = usage * 5.0;

  const subtotal = Math.round(baseRate + energyCharge + climateCharge + fuelAdjustmentCharge);

  // 부가가치세 (10%)
  const vat = Math.round(subtotal * 0.1);

  // 전력산업기반기금 (3.7% - 10원 미만 절사)
  const powerFund = Math.floor((subtotal * 0.037) / 10) * 10;

  // 최종 요금 (10원 미만 절사)
  const totalBill = Math.floor((subtotal + vat + powerFund) / 10) * 10;

  let nextTierThreshold: number | null = null;
  let kwhToNextTier: number | null = null;

  if (tier === 1) {
    nextTierThreshold = tier1Limit;
    kwhToNextTier = tier1Limit - usage;
  } else if (tier === 2) {
    nextTierThreshold = tier2Limit;
    kwhToNextTier = tier2Limit - usage;
  }

  return {
    usageKwh: usage,
    tier,
    tierName,
    baseRate: Math.round(baseRate),
    energyCharge: Math.round(energyCharge),
    climateCharge: Math.round(climateCharge),
    fuelAdjustmentCharge: Math.round(fuelAdjustmentCharge),
    subtotal,
    vat,
    powerFund,
    totalBill,
    nextTierThreshold,
    kwhToNextTier,
  };
}

// ==========================================
// 6. 환율 계산기
// ==========================================
export const DEFAULT_CURRENCIES: CurrencyRate[] = [
  { code: 'KRW', name: '대한민국 원', symbol: '₩', rateToKrw: 1.0, flag: '🇰🇷' },
  { code: 'USD', name: '미국 달러', symbol: '$', rateToKrw: 1385.5, flag: '🇺🇸' },
  { code: 'EUR', name: '유로화', symbol: '€', rateToKrw: 1495.2, flag: '🇪🇺' },
  { code: 'JPY', name: '일본 엔 (100엔)', symbol: '¥', rateToKrw: 915.4, flag: '🇯🇵', unitMultiplier: 100 },
  { code: 'CNY', name: '중국 위안', symbol: '¥', rateToKrw: 191.8, flag: '🇨🇳' },
  { code: 'GBP', name: '영국 파운드', symbol: '£', rateToKrw: 1760.3, flag: '🇬🇧' },
  { code: 'CAD', name: '캐나다 달러', symbol: 'C$', rateToKrw: 1012.4, flag: '🇨🇦' },
  { code: 'AUD', name: '호주 달러', symbol: 'A$', rateToKrw: 910.5, flag: '🇦🇺' },
  { code: 'CHF', name: '스위스 프랑', symbol: 'CHF', rateToKrw: 1560.8, flag: '🇨🇭' },
  { code: 'SGD', name: '싱가포르 달러', symbol: 'S$', rateToKrw: 1032.1, flag: '🇸🇬' },
  { code: 'HKD', name: '홍콩 달러', symbol: 'HK$', rateToKrw: 177.3, flag: '🇭🇰' },
  { code: 'THB', name: '태국 바트', symbol: '฿', rateToKrw: 39.8, flag: '🇹🇭' },
];

export function calculateExchange(
  input: ExchangeInput,
  currencies: CurrencyRate[] = DEFAULT_CURRENCIES
): ExchangeResult {
  const fromCurr = currencies.find((c) => c.code === input.fromCode) || currencies[1]; // USD
  const toCurr = currencies.find((c) => c.code === input.toCode) || currencies[0]; // KRW

  // Calculate value in KRW first
  let fromRate = fromCurr.rateToKrw;
  if (fromCurr.unitMultiplier) {
    fromRate = fromRate / fromCurr.unitMultiplier;
  }

  let toRate = toCurr.rateToKrw;
  if (toCurr.unitMultiplier) {
    toRate = toRate / toCurr.unitMultiplier;
  }

  // Override rate if custom rate supplied
  if (input.customRate && input.customRate > 0) {
    if (input.fromCode === 'KRW') {
      toRate = 1 / input.customRate;
    } else {
      fromRate = input.customRate;
    }
  }

  // Amount in KRW
  const krwValue = input.amount * fromRate;
  
  // Amount in Target Currency
  const convertedAmount = krwValue / toRate;

  // Cross rate
  const appliedRate = fromRate / toRate;

  return {
    fromCode: input.fromCode,
    toCode: input.toCode,
    fromAmount: input.amount,
    convertedAmount: Number(convertedAmount.toFixed(2)),
    appliedRate: Number(appliedRate.toFixed(4)),
  };
}

// Formatters
export function formatKrw(val: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(val)) + '원';
}

export function formatNum(val: number): string {
  return new Intl.NumberFormat('ko-KR').format(val);
}
