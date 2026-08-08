import React, { Suspense, lazy, useEffect, useState } from 'react';
import { CalculatorCategory, CalculatorId, CalculationHistoryItem, CalculationInputState, SaveHistoryFn } from './types';
import { CALCULATOR_LIST, CALCULATOR_GUIDES } from './data/calculatorInfo';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModals } from './components/LegalModals';
import { RecentHistoryModal } from './components/RecentHistoryModal';
import { QuickNavGrid } from './components/QuickNavGrid';
import { AdSenseBanner } from './components/AdSenseBanner';
import { CalculatorGuideCard } from './components/CalculatorGuideCard';
import { queuePendingHistoryRestore } from './utils/historyRestore';

// Calculators
import { ShieldCheck, CheckCircle, MessageCircleWarning } from 'lucide-react';

const SalaryCalculator = lazy(() => import('./components/calculators/SalaryCalculator').then((module) => ({ default: module.SalaryCalculator })));
const BmiCalculator = lazy(() => import('./components/calculators/BmiCalculator').then((module) => ({ default: module.BmiCalculator })));
const BmrCalculator = lazy(() => import('./components/calculators/BmrCalculator').then((module) => ({ default: module.BmrCalculator })));
const BodyFatCalculator = lazy(() => import('./components/calculators/BodyFatCalculator').then((module) => ({ default: module.BodyFatCalculator })));
const IdealWeightCalculator = lazy(() => import('./components/calculators/IdealWeightCalculator').then((module) => ({ default: module.IdealWeightCalculator })));
const MacroCalculator = lazy(() => import('./components/calculators/MacroCalculator').then((module) => ({ default: module.MacroCalculator })));
const SmokingQuitCalculator = lazy(() => import('./components/calculators/SmokingQuitCalculator').then((module) => ({ default: module.SmokingQuitCalculator })));
const TdeeCalculator = lazy(() => import('./components/calculators/TdeeCalculator').then((module) => ({ default: module.TdeeCalculator })));
const WaterIntakeCalculator = lazy(() => import('./components/calculators/WaterIntakeCalculator').then((module) => ({ default: module.WaterIntakeCalculator })));
const WhrCalculator = lazy(() => import('./components/calculators/WhrCalculator').then((module) => ({ default: module.WhrCalculator })));
const SeveranceCalculator = lazy(() => import('./components/calculators/SeveranceCalculator').then((module) => ({ default: module.SeveranceCalculator })));
const VatCalculator = lazy(() => import('./components/calculators/VatCalculator').then((module) => ({ default: module.VatCalculator })));
const ElectricityCalculator = lazy(() => import('./components/calculators/ElectricityCalculator').then((module) => ({ default: module.ElectricityCalculator })));
const ExchangeCalculator = lazy(() => import('./components/calculators/ExchangeCalculator').then((module) => ({ default: module.ExchangeCalculator })));
const DateCalculator = lazy(() => import('./components/calculators/DateCalculator').then((module) => ({ default: module.DateCalculator })));
const UnitCalculator = lazy(() => import('./components/calculators/UnitCalculator').then((module) => ({ default: module.UnitCalculator })));
const ScientificCalculator = lazy(() => import('./components/calculators/ScientificCalculator').then((module) => ({ default: module.ScientificCalculator })));
const PercentCalculator = lazy(() => import('./components/calculators/PercentCalculator').then((module) => ({ default: module.PercentCalculator })));
const LottoCalculator = lazy(() => import('./components/calculators/LottoCalculator').then((module) => ({ default: module.LottoCalculator })));
const GoldCalculator = lazy(() => import('./components/calculators/GoldCalculator').then((module) => ({ default: module.GoldCalculator })));
const LoanCalculator = lazy(() => import('./components/calculators/LoanCalculator').then((module) => ({ default: module.LoanCalculator })));
const HourlyCalculator = lazy(() => import('./components/calculators/HourlyCalculator').then((module) => ({ default: module.HourlyCalculator })));
const CarTaxCalculator = lazy(() => import('./components/calculators/CarTaxCalculator').then((module) => ({ default: module.CarTaxCalculator })));
const RealEstateCalculator = lazy(() => import('./components/calculators/RealEstateCalculator').then((module) => ({ default: module.RealEstateCalculator })));
const LadderGameCalculator = lazy(() => import('./components/calculators/LadderGameCalculator').then((module) => ({ default: module.LadderGameCalculator })));
const GomokuCalculator = lazy(() => import('./components/calculators/GomokuCalculator').then((module) => ({ default: module.GomokuCalculator })));
const WatermelonGameCalculator = lazy(() => import('./components/calculators/WatermelonGameCalculator').then((module) => ({ default: module.WatermelonGameCalculator })));
const KoreanAgeCalculator = lazy(() => import('./components/calculators/KoreanAgeCalculator').then((module) => ({ default: module.KoreanAgeCalculator })));
const BloodAlcoholCalculator = lazy(() => import('./components/calculators/BloodAlcoholCalculator').then((module) => ({ default: module.BloodAlcoholCalculator })));
const PregnancyCalculator = lazy(() => import('./components/calculators/PregnancyCalculator').then((module) => ({ default: module.PregnancyCalculator })));
const EvChargingCalculator = lazy(() => import('./components/calculators/EvChargingCalculator').then((module) => ({ default: module.EvChargingCalculator })));
const SavingsInterestCalculator = lazy(() => import('./components/calculators/SavingsInterestCalculator').then((module) => ({ default: module.SavingsInterestCalculator })));
const YearEndTaxCalculator = lazy(() => import('./components/calculators/YearEndTaxCalculator').then((module) => ({ default: module.YearEndTaxCalculator })));
const NationalPensionCalculator = lazy(() => import('./components/calculators/NationalPensionCalculator').then((module) => ({ default: module.NationalPensionCalculator })));
const HousingSubscriptionCalculator = lazy(() => import('./components/calculators/HousingSubscriptionCalculator').then((module) => ({ default: module.HousingSubscriptionCalculator })));
const OvulationCalculator = lazy(() => import('./components/calculators/OvulationCalculator').then((module) => ({ default: module.OvulationCalculator })));
const SleepCycleCalculator = lazy(() => import('./components/calculators/SleepCycleCalculator').then((module) => ({ default: module.SleepCycleCalculator })));
const ExerciseCalorieCalculator = lazy(() => import('./components/calculators/ExerciseCalorieCalculator').then((module) => ({ default: module.ExerciseCalorieCalculator })));
const BillSplitCalculator = lazy(() => import('./components/calculators/BillSplitCalculator').then((module) => ({ default: module.BillSplitCalculator })));
const GiftMoneyCalculator = lazy(() => import('./components/calculators/GiftMoneyCalculator').then((module) => ({ default: module.GiftMoneyCalculator })));
const MovingCostCalculator = lazy(() => import('./components/calculators/MovingCostCalculator').then((module) => ({ default: module.MovingCostCalculator })));
const TimeZoneCalculator = lazy(() => import('./components/calculators/TimeZoneCalculator').then((module) => ({ default: module.TimeZoneCalculator })));

const calculatorLoadingFallback = (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
    <div className="animate-pulse space-y-4">
      <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-4 w-52 rounded bg-slate-100 dark:bg-slate-800/80" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800/80" />
        <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800/80" />
      </div>
      <div className="h-72 rounded-xl bg-slate-100 dark:bg-slate-800/80" />
    </div>
  </div>
);

const SITE_URL = 'https://www.smart-toolkit.com';

// Matches the static defaults baked into index.html — restored whenever the
// active calculator resolves back to the root path so the homepage keeps its
// broad, brand-level SEO metadata instead of a single calculator's.
const HOME_META = {
  title: '스마트 툴킷 | 연봉·BMI·퇴직금·부가세·환율 생활 계산기',
  description: '연봉 실수령액, BMI, 대출 이자, 퇴직금, 부가세, 전기요금, 환율, 퍼센트, 사다리, 로또까지 한 번에 계산하는 스마트 툴킷.',
};

// Root path renders the default calculator (salary); every other calculator
// gets its own path so it can be linked to, refreshed, and listed in the sitemap.
const pathForCalc = (id: CalculatorId): string => (id === 'salary' ? '/' : `/${id}`);

const calcIdFromPath = (pathname: string): CalculatorId | null => {
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  if (!slug) return 'salary';
  const match = CALCULATOR_LIST.find((c) => c.id === slug);
  return match ? match.id : null;
};

export default function App() {
  const [activeCategory, setActiveCategory] = useState<CalculatorCategory>('all');
  const [activeCalcId, setActiveCalcId] = useState<CalculatorId>(() => {
    if (typeof window === 'undefined') return 'salary';
    return calcIdFromPath(window.location.pathname) ?? 'salary';
  });
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

  const [favoriteIds, setFavoriteIds] = useState<CalculatorId[]>(() => {
    try {
      const saved = localStorage.getItem('calc_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [calculatorRenderNonce, setCalculatorRenderNonce] = useState(0);
  const [saveToast, setSaveToast] = useState<{ key: number; message: string } | null>(null);
  const [latestSavedHistoryId, setLatestSavedHistoryId] = useState<string | null>(null);
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

  useEffect(() => {
    if (!saveToast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveToast(null);
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [saveToast]);

  useEffect(() => {
    if (!latestSavedHistoryId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setLatestSavedHistoryId(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [latestSavedHistoryId]);

  // Keep the URL in sync with the active calculator so each one is a real,
  // linkable, refreshable, sitemap-eligible page.
  const navigateToCalc = (id: CalculatorId) => {
    setActiveCalcId(id);
    const path = pathForCalc(id);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };

  // Handle browser back/forward navigation between calculator pages.
  useEffect(() => {
    const onPopState = () => {
      const id = calcIdFromPath(window.location.pathname);
      if (id) {
        setActiveCalcId(id);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Keep <title>, meta description, canonical/OG/Twitter tags in sync with the
  // active calculator so each URL carries its own distinct, indexable metadata.
  useEffect(() => {
    const meta = CALCULATOR_LIST.find((c) => c.id === activeCalcId);
    if (!meta) return;

    const path = pathForCalc(activeCalcId);
    const isHome = path === '/';
    const canonicalUrl = `${SITE_URL}${path}`;
    const title = isHome ? HOME_META.title : `${meta.name} | 스마트 툴킷`;
    const description = isHome ? HOME_META.description : meta.shortDesc;

    document.title = title;

    const setMeta = (selector: string, attr: 'content' | 'href', value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('link[rel="canonical"]', 'href', canonicalUrl);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
  }, [activeCalcId]);

  // Save history to LocalStorage
  const saveToHistory: SaveHistoryFn = (
    title: string,
    summary: string,
    details: Record<string, string | number>,
    inputState?: CalculationInputState
  ) => {
    const calcMeta = CALCULATOR_LIST.find((c) => c.id === activeCalcId);
    const newItem: CalculationHistoryItem = {
      id: Date.now().toString(),
      calculatorId: activeCalcId,
      calculatorName: calcMeta ? calcMeta.name : title,
      timestamp: Date.now(),
      summary,
      details,
      inputState,
    };

    setHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, 30);
      try {
        localStorage.setItem('calc_history', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save history', e);
      }
      return updated;
    });
    setLatestSavedHistoryId(newItem.id);
    setSaveToast({
      key: Date.now(),
      message: `${calcMeta ? calcMeta.name : title} 저장됨`,
    });
  };

  const toggleFavorite = (id: CalculatorId) => {
    setFavoriteIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id];
      try {
        localStorage.setItem('calc_favorites', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save favorites', e);
      }

      if (activeCategory === 'favorites' && !updated.includes(activeCalcId)) {
        const firstFavorite = CALCULATOR_LIST.find((c) => updated.includes(c.id));
        if (firstFavorite) {
          navigateToCalc(firstFavorite.id);
        }
      }

      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('calc_history');
  };

  const handleSelectHistory = (item: CalculationHistoryItem) => {
    const calcMeta = CALCULATOR_LIST.find((calc) => calc.id === item.calculatorId);

    queuePendingHistoryRestore(item);
    setActiveCategory(calcMeta?.category ?? 'all');
    navigateToCalc(item.calculatorId);
    setCalculatorRenderNonce((prev) => prev + 1);
    setIsHistoryOpen(false);

    window.setTimeout(() => {
      document.getElementById('calculator-widget')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const activeCalcMeta = CALCULATOR_LIST.find((c) => c.id === activeCalcId) || CALCULATOR_LIST[0];
  const activeGuide = CALCULATOR_GUIDES[activeCalcId];
  const isFavoritesEmpty = activeCategory === 'favorites' && favoriteIds.length === 0;

  const handleSelectCategory = (cat: CalculatorCategory) => {
    setActiveCategory(cat);
    setSearchQuery('');
    const firstInCategory = CALCULATOR_LIST.find(
      (c) =>
        cat === 'all' ||
        c.category === cat ||
        (cat === 'favorites' && favoriteIds.includes(c.id))
    );
    if (firstInCategory) {
      navigateToCalc(firstInCategory.id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      case 'scientific':
        return <ScientificCalculator onSaveHistory={saveToHistory} />;
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
      case 'gomoku':
        return <GomokuCalculator onSaveHistory={saveToHistory} />;
      case 'watermelonGame':
        return <WatermelonGameCalculator onSaveHistory={saveToHistory} />;
      case 'koreanAge':
        return <KoreanAgeCalculator onSaveHistory={saveToHistory} />;
      case 'bloodAlcohol':
        return <BloodAlcoholCalculator onSaveHistory={saveToHistory} />;
      case 'pregnancy':
        return <PregnancyCalculator onSaveHistory={saveToHistory} />;
      case 'evCharging':
        return <EvChargingCalculator onSaveHistory={saveToHistory} />;
      case 'savingsInterest':
        return <SavingsInterestCalculator onSaveHistory={saveToHistory} />;
      case 'yearEndTax':
        return <YearEndTaxCalculator onSaveHistory={saveToHistory} />;
      case 'nationalPension':
        return <NationalPensionCalculator onSaveHistory={saveToHistory} />;
      case 'housingSubscription':
        return <HousingSubscriptionCalculator onSaveHistory={saveToHistory} />;
      case 'ovulation':
        return <OvulationCalculator onSaveHistory={saveToHistory} />;
      case 'sleepCycle':
        return <SleepCycleCalculator onSaveHistory={saveToHistory} />;
      case 'exerciseCalorie':
        return <ExerciseCalorieCalculator onSaveHistory={saveToHistory} />;
      case 'billSplit':
        return <BillSplitCalculator onSaveHistory={saveToHistory} />;
      case 'giftMoney':
        return <GiftMoneyCalculator onSaveHistory={saveToHistory} />;
      case 'movingCost':
        return <MovingCostCalculator onSaveHistory={saveToHistory} />;
      case 'timeZone':
        return <TimeZoneCalculator onSaveHistory={saveToHistory} />;
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
          onSelectCategory={handleSelectCategory}
          activeCalcId={activeCalcId}
          onSelectCalc={(id) => {
            navigateToCalc(id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          historyCount={history.length}
          onOpenHistory={() => setIsHistoryOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
        />

        {/* Main Content Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {!isFavoritesEmpty && (
            <>
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
                <Suspense fallback={calculatorLoadingFallback}>
                  <div key={`${activeCalcId}-${calculatorRenderNonce}`}>{renderCalculator()}</div>
                </Suspense>
              </section>

              {/* Middle Content AdSense Banner */}
              <AdSenseBanner slotType="inline" />

              {/* Detailed Educational Guide & FAQ Article Card for AdSense SEO Quality */}
              {activeGuide && <CalculatorGuideCard guide={activeGuide} />}
            </>
          )}

          {/* Quick Calculator Switcher Grid */}
          <QuickNavGrid
            activeCategory={activeCategory}
            activeCalcId={activeCalcId}
            onSelectCalc={(id) => {
              navigateToCalc(id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            searchQuery={searchQuery}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onResetFilters={() => handleSelectCategory('all')}
          />
        </main>
      </div>

      {/* Footer & Compliance Section */}
      <Footer onOpenModal={(type) => setLegalModalType(type)} />

      {/* Sticky quick contact CTA */}
      <button
        onClick={() => setLegalModalType('contact')}
        className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-40 inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white px-3 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-base font-extrabold shadow-xl shadow-rose-900/30 transition-colors"
        aria-label="1:1문의 및 제보하기"
        title="1:1문의 및 제보하기"
      >
        <MessageCircleWarning className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="sm:hidden">문의</span>
        <span className="hidden sm:inline">1:1문의 및 제보</span>
      </button>

      {/* Legal & Terms Modals */}
      <LegalModals
        isOpen={legalModalType !== null}
        onClose={() => setLegalModalType(null)}
        type={legalModalType}
      />

      {saveToast && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 px-4 w-full max-w-md pointer-events-none">
          <div className="pointer-events-auto rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-3 shadow-xl shadow-emerald-900/10 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-300">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">저장됨</div>
                <div className="text-xs text-slate-600 dark:text-slate-300 break-words">{saveToast.message}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent History Modal */}
      <RecentHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
        onSelectHistory={handleSelectHistory}
        latestSavedHistoryId={latestSavedHistoryId}
      />
    </div>
  );
}
