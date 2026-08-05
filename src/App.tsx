import React, { useState, useEffect } from 'react';
import { CalculatorCategory, CalculatorId, CalculationHistoryItem } from './types';
import { CALCULATOR_LIST, CALCULATOR_GUIDES } from './data/calculatorInfo';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModals } from './components/LegalModals';
import { RecentHistoryModal } from './components/RecentHistoryModal';
import { QuickNavGrid } from './components/QuickNavGrid';
import { AdSenseBanner } from './components/AdSenseBanner';
import { CalculatorGuideCard } from './components/CalculatorGuideCard';

// Calculators
import { SalaryCalculator } from './components/calculators/SalaryCalculator';
import { BmiCalculator } from './components/calculators/BmiCalculator';
import { BmrCalculator } from './components/calculators/BmrCalculator';
import { BodyFatCalculator } from './components/calculators/BodyFatCalculator';
import { IdealWeightCalculator } from './components/calculators/IdealWeightCalculator';
import { MacroCalculator } from './components/calculators/MacroCalculator';
import { SmokingQuitCalculator } from './components/calculators/SmokingQuitCalculator';
import { TdeeCalculator } from './components/calculators/TdeeCalculator';
import { WaterIntakeCalculator } from './components/calculators/WaterIntakeCalculator';
import { WhrCalculator } from './components/calculators/WhrCalculator';
import { SeveranceCalculator } from './components/calculators/SeveranceCalculator';
import { VatCalculator } from './components/calculators/VatCalculator';
import { ElectricityCalculator } from './components/calculators/ElectricityCalculator';
import { ExchangeCalculator } from './components/calculators/ExchangeCalculator';
import { DateCalculator } from './components/calculators/DateCalculator';
import { UnitCalculator } from './components/calculators/UnitCalculator';
import { PercentCalculator } from './components/calculators/PercentCalculator';
import { LottoCalculator } from './components/calculators/LottoCalculator';
import { GoldCalculator } from './components/calculators/GoldCalculator';
import { LoanCalculator } from './components/calculators/LoanCalculator';
import { HourlyCalculator } from './components/calculators/HourlyCalculator';
import { CarTaxCalculator } from './components/calculators/CarTaxCalculator';
import { RealEstateCalculator } from './components/calculators/RealEstateCalculator';
import { LadderGameCalculator } from './components/calculators/LadderGameCalculator';

import { ShieldCheck, CheckCircle, MessageCircleWarning } from 'lucide-react';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<CalculatorCategory>('all');
  const [activeCalcId, setActiveCalcId] = useState<CalculatorId>('salary');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [history, setHistory] = useState<CalculationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('calc_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | 'disclaimer' | 'contact' | null>(null);

  // Sync dark mode class on HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Save history to LocalStorage
  const saveToHistory = (
    title: string,
    summary: string,
    details: Record<string, string | number>
  ) => {
    const calcMeta = CALCULATOR_LIST.find((c) => c.id === activeCalcId);
    const newItem: CalculationHistoryItem = {
      id: Date.now().toString(),
      calculatorId: activeCalcId,
      calculatorName: calcMeta ? calcMeta.name : title,
      timestamp: Date.now(),
      summary,
      details,
    };

    const updated = [newItem, ...history].slice(0, 30); // Keep last 30
    setHistory(updated);
    try {
      localStorage.setItem('calc_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('calc_history');
  };

  const activeCalcMeta = CALCULATOR_LIST.find((c) => c.id === activeCalcId) || CALCULATOR_LIST[0];
  const activeGuide = CALCULATOR_GUIDES[activeCalcId];

  // Render Active Calculator Widget
  const renderCalculator = () => {
    switch (activeCalcId) {
      case 'salary':
        return <SalaryCalculator onSaveHistory={saveToHistory} />;
      case 'bmi':
        return <BmiCalculator onSaveHistory={saveToHistory} />;
      case 'bmr':
        return <BmrCalculator onSaveHistory={saveToHistory} />;
      case 'bodyFat':
        return <BodyFatCalculator onSaveHistory={saveToHistory} />;
      case 'idealWeight':
        return <IdealWeightCalculator onSaveHistory={saveToHistory} />;
      case 'macro':
        return <MacroCalculator onSaveHistory={saveToHistory} />;
      case 'smokingQuit':
        return <SmokingQuitCalculator onSaveHistory={saveToHistory} />;
      case 'tdee':
        return <TdeeCalculator onSaveHistory={saveToHistory} />;
      case 'waterIntake':
        return <WaterIntakeCalculator onSaveHistory={saveToHistory} />;
      case 'whr':
        return <WhrCalculator onSaveHistory={saveToHistory} />;
      case 'severance':
        return <SeveranceCalculator onSaveHistory={saveToHistory} />;
      case 'vat':
        return <VatCalculator onSaveHistory={saveToHistory} />;
      case 'electricity':
        return <ElectricityCalculator onSaveHistory={saveToHistory} />;
      case 'exchange':
        return <ExchangeCalculator onSaveHistory={saveToHistory} />;
      case 'date':
        return <DateCalculator onSaveHistory={saveToHistory} />;
      case 'unit':
        return <UnitCalculator onSaveHistory={saveToHistory} />;
      case 'percent':
        return <PercentCalculator onSaveHistory={saveToHistory} />;
      case 'lotto':
        return <LottoCalculator onSaveHistory={saveToHistory} />;
      case 'gold':
        return <GoldCalculator onSaveHistory={saveToHistory} />;
      case 'loan':
        return <LoanCalculator onSaveHistory={saveToHistory} />;
      case 'hourly':
        return <HourlyCalculator onSaveHistory={saveToHistory} />;
      case 'carTax':
        return <CarTaxCalculator onSaveHistory={saveToHistory} />;
      case 'realEstate':
        return <RealEstateCalculator onSaveHistory={saveToHistory} />;
      case 'ladderGame':
        return <LadderGameCalculator onSaveHistory={saveToHistory} />;
      default:
        return <SalaryCalculator onSaveHistory={saveToHistory} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors font-sans antialiased flex flex-col justify-between">
      <div>
        {/* Header Navigation */}
        <Header
          activeCategory={activeCategory}
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            setSearchQuery('');
            const firstInCategory = CALCULATOR_LIST.find(
              (c) => cat === 'all' || c.category === cat
            );
            if (firstInCategory) {
              setActiveCalcId(firstInCategory.id);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          activeCalcId={activeCalcId}
          onSelectCalc={(id) => {
            setActiveCalcId(id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          historyCount={history.length}
          onOpenHistory={() => setIsHistoryOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        {/* Main Content Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Top Banner & Title Box */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {activeCalcMeta.name}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                {activeCalcMeta.shortDesc}
              </p>

              <div className="flex flex-wrap gap-4 pt-2 text-xs font-medium text-gray-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>실시간 자동 산출</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>개인정보 미저장 안전 도구</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex sm:flex-col gap-2">
              <button
                onClick={() => {
                  const widget = document.getElementById('calculator-widget');
                  widget?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto bg-gray-900 hover:bg-black dark:bg-slate-100 dark:hover:bg-white dark:text-gray-900 text-white px-5 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors shadow-2xs"
              >
                계산기 바로 시작
              </button>
            </div>
          </div>

          {/* Top AdSense Banner Placeholder */}
          <AdSenseBanner slotType="header" />

          {/* Active Calculator Widget Area */}
          <section className="scroll-mt-24" id="calculator-widget">
            {renderCalculator()}
          </section>

          {/* Middle Content AdSense Banner */}
          <AdSenseBanner slotType="inline" />

          {/* Detailed Educational Guide & FAQ Article Card for AdSense SEO Quality */}
          {activeGuide && <CalculatorGuideCard guide={activeGuide} />}

          {/* Quick Calculator Switcher Grid */}
          <QuickNavGrid
            activeCategory={activeCategory}
            activeCalcId={activeCalcId}
            onSelectCalc={(id) => {
              setActiveCalcId(id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            searchQuery={searchQuery}
          />
        </main>
      </div>

      {/* Footer & Compliance Section */}
      <Footer onOpenModal={(type) => setLegalModalType(type)} />

      {/* Sticky quick contact CTA */}
      <button
        onClick={() => setLegalModalType('contact')}
        className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 inline-flex items-center gap-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 sm:px-5 sm:py-3 text-sm sm:text-base font-extrabold shadow-xl shadow-rose-900/30 transition-colors"
        aria-label="1:1문의 및 제보하기"
        title="1:1문의 및 제보하기"
      >
        <MessageCircleWarning className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>1:1문의 및 제보</span>
      </button>

      {/* Legal & Terms Modals */}
      <LegalModals
        isOpen={legalModalType !== null}
        onClose={() => setLegalModalType(null)}
        type={legalModalType}
      />

      {/* Recent History Modal */}
      <RecentHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
