import React from 'react';
import { CalculatorCategory, CalculatorId } from '../types';
import { CALCULATOR_LIST } from '../data/calculatorInfo';
import {
  Calculator,
  Search,
  Moon,
  Sun,
  History,
  Bookmark,
  Banknote,
  Activity,
  Coins,
  Receipt,
  Zap,
  ArrowLeftRight,
  Calendar,
  Ruler,
  Percent,
  Sparkles,
  Sparkle,
  Landmark,
  Clock,
  Car,
  Building2,
} from 'lucide-react';

interface HeaderProps {
  activeCategory: CalculatorCategory;
  onSelectCategory: (cat: CalculatorCategory) => void;
  activeCalcId: CalculatorId;
  onSelectCalc: (id: CalculatorId) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  historyCount: number;
  onOpenHistory: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onSelectCategory,
  activeCalcId,
  onSelectCalc,
  searchQuery,
  onSearchChange,
  historyCount,
  onOpenHistory,
  darkMode,
  onToggleDarkMode,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Banknote':
        return <Banknote className="w-4 h-4" />;
      case 'Activity':
        return <Activity className="w-4 h-4" />;
      case 'Coins':
        return <Coins className="w-4 h-4" />;
      case 'Receipt':
        return <Receipt className="w-4 h-4" />;
      case 'Zap':
        return <Zap className="w-4 h-4" />;
      case 'ArrowLeftRight':
        return <ArrowLeftRight className="w-4 h-4" />;
      case 'Calendar':
        return <Calendar className="w-4 h-4" />;
      case 'Ruler':
        return <Ruler className="w-4 h-4" />;
      case 'Percent':
        return <Percent className="w-4 h-4" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'Sparkle':
        return <Sparkle className="w-4 h-4" />;
      case 'Landmark':
        return <Landmark className="w-4 h-4" />;
      case 'Clock':
        return <Clock className="w-4 h-4" />;
      case 'Car':
        return <Car className="w-4 h-4" />;
      case 'Building2':
        return <Building2 className="w-4 h-4" />;
      default:
        return <Calculator className="w-4 h-4" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Navbar */}
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo */}
          <div
            onClick={() => onSelectCategory('all')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-800 dark:text-slate-100 flex items-center gap-2">
                <span>생활 계산기</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 uppercase tracking-wider">
                  도구 모음
                </span>
              </h1>
              <p className="text-xs text-gray-400 dark:text-slate-500 hidden sm:block">
                연봉, BMI, 퇴직금, 부가세, 전기요금, 환율 모의 계산
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md relative hidden sm:block">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="계산기 검색 (예: 연봉, BMI, 전기요금, 부가세...)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/60 pl-10 pr-4 py-2 text-xs font-medium text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Recent History Button */}
            <button
              onClick={onOpenHistory}
              className="relative px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="계산 기록"
            >
              <History className="w-4 h-4 text-gray-500" />
              <span className="hidden md:inline uppercase tracking-wider text-[11px]">계산기록</span>
              {historyCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
                  {historyCount}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              title="테마 변경"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <nav className="flex items-center gap-6 overflow-x-auto py-2.5 border-t border-gray-100 dark:border-slate-800/80 no-scrollbar text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400">
          {[
            { id: 'all', label: 'ALL TOOLS' },
            { id: 'finance', label: 'FINANCE' },
            { id: 'health', label: 'HEALTH' },
            { id: 'life', label: 'UTILITIES' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id as CalculatorCategory)}
              className={`py-1 transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                activeCategory === cat.id
                  ? 'text-blue-600 dark:text-blue-400 font-bold border-blue-600 dark:border-blue-400'
                  : 'border-transparent hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        {/* Quick Horizontal Calculator List */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 border-t border-gray-100 dark:border-slate-800/40 no-scrollbar">
          {CALCULATOR_LIST.filter(
            (c) => activeCategory === 'all' || c.category === activeCategory
          ).map((c) => {
            const isActive = activeCalcId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelectCalc(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  isActive
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold shadow-2xs'
                    : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:border-gray-300'
                }`}
              >
                <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}>
                  {getIcon(c.iconName)}
                </span>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
