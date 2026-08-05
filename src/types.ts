export type CalculatorCategory = 'all' | 'finance' | 'health' | 'life' | 'games';

export type CalculatorId = 
  | 'salary' 
  | 'bmi' 
  | 'bmr'
  | 'bodyFat'
  | 'idealWeight'
  | 'macro'
  | 'smokingQuit'
  | 'tdee'
  | 'waterIntake'
  | 'whr'
  | 'severance' 
  | 'vat' 
  | 'electricity' 
  | 'exchange'
  | 'date'
  | 'unit'
  | 'percent'
  | 'lotto'
  | 'gold'
  | 'loan'
  | 'hourly'
  | 'carTax'
  | 'realEstate'
  | 'ladderGame';

export interface CalculatorMeta {
  id: CalculatorId;
  name: string;
  shortDesc: string;
  category: 'finance' | 'health' | 'life' | 'games';
  iconName: string;
  badge?: string;
  popular?: boolean;
}

export interface CalculationHistoryItem {
  id: string;
  calculatorId: CalculatorId;
  calculatorName: string;
  timestamp: number;
  summary: string;
  details: Record<string, string | number>;
}

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateToKrw: number; // KRW per 1 unit (or 100 JPY)
  flag: string;
  unitMultiplier?: number; // e.g. 100 for JPY
}

// Salary input & result
export interface SalaryInput {
  salaryType: 'annual' | 'monthly';
  amount: number; // in KRW
  nonTaxable: number; // monthly non-taxable amount in KRW (default 200,000)
  dependents: number; // including self (default 1)
  childrenUnder20: number; // default 0
}

export interface SalaryResult {
  grossMonthly: number;
  grossAnnual: number;
  nonTaxableMonthly: number;
  taxableMonthly: number;
  nationalPension: number; // 4.5%
  healthInsurance: number; // 3.545%
  longTermCare: number; // 12.95% of health insurance
  employmentInsurance: number; // 0.9%
  totalSocialInsurance: number;
  incomeTax: number; // simplified tax table approximation
  localIncomeTax: number; // 10% of income tax
  totalTax: number;
  totalDeduction: number;
  netMonthlyPay: number;
  netAnnualPay: number;
  deductionRatio: number; // percentage of total deductions
}

// BMI input & result
export interface BmiInput {
  gender: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
}

export interface BmiResult {
  bmi: number;
  status: '저체중' | '정상' | '과체중' | '경도비만' | '중정도비만' | '고도비만';
  statusColor: string;
  idealWeightMin: number;
  idealWeightMax: number;
  weightDiffToNormal: number; // kg to reach normal range (0 if normal)
  calorieEstimate: number;
  healthTip: string;
}

// Severance input & result
export interface SeveranceInput {
  joinDate: string; // YYYY-MM-DD
  retireDate: string; // YYYY-MM-DD
  month1Salary: number;
  month2Salary: number;
  month3Salary: number;
  annualBonus: number; // annual bonus sum
  annualLeavePay: number; // annual leave allowance
}

export interface SeveranceResult {
  totalWorkDays: number;
  yearsOfService: number;
  threeMonthSalaryTotal: number;
  bonusForThreeMonths: number;
  leavePayForThreeMonths: number;
  totalWageForThreeMonths: number;
  averageDailyWage: number; // 1일 평균임금
  estimatedSeverance: number; // Estimated severance pay
}

// VAT input & result
export interface VatInput {
  mode: 'fromSupply' | 'fromTotal'; // 공급가액 기준 OR 합계금액 기준
  amount: number;
  vatRate: number; // default 10%
}

export interface VatResult {
  supplyValue: number;
  vatAmount: number;
  totalAmount: number;
}

// Electricity input & result
export interface ElectricityInput {
  contractType: 'lowVoltage' | 'highVoltage'; // 주택용 저압 vs 고압
  season: 'summer' | 'other'; // 여름철(7-8월) vs 기타계절
  usageKwh: number;
}

export interface ElectricityResult {
  usageKwh: number;
  tier: 1 | 2 | 3;
  tierName: string;
  baseRate: number; // 기본요금
  energyCharge: number; // 전력량요금
  climateCharge: number; // 기후환경요금 (9원/kWh)
  fuelAdjustmentCharge: number; // 연료비조정액 (기본 +5원/kWh)
  subtotal: number;
  vat: number; // 10%
  powerFund: number; // 3.7%
  totalBill: number;
  nextTierThreshold: number | null;
  kwhToNextTier: number | null;
}

// Exchange input & result
export interface ExchangeInput {
  fromCode: string;
  toCode: string;
  amount: number;
  customRate?: number;
}

export interface ExchangeResult {
  fromCode: string;
  toCode: string;
  fromAmount: number;
  convertedAmount: number;
  appliedRate: number;
}
