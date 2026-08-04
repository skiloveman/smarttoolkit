import React from 'react';
import { CalculatorId, CalculatorMeta } from '../types';
import { CALCULATOR_LIST } from '../data/calculatorInfo';
import {
  Banknote,
  Activity,
  Coins,
  Receipt,
  Zap,
  ArrowLeftRight,
  Calendar,
  Ruler,
  Percent,
  Calculator,
  ArrowRight,
  Flame,
  Sparkles,
  Sparkle,
  Landmark,
  Clock,
  Car,
  Building2,
} from 'lucide-react';

interface Props {
  activeCalcId: CalculatorId;
  onSelectCalc: (id: CalculatorId) => void;
  searchQuery: string;
}

export const QuickNavGrid: React.FC<Props> = ({ activeCalcId, onSelectCalc, searchQuery }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Banknote':
        return <Banknote className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Coins':
        return <Coins className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'Receipt':
        return <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'ArrowLeftRight':
        return <ArrowLeftRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'Calendar':
        return <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'Ruler':
        return <Ruler className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Percent':
        return <Percent className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'Sparkle':
        return <Sparkle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'Landmark':
        return <Landmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'Clock':
        return <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
      case 'Car':
        return <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'Building2':
        return <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const filtered = CALCULATOR_LIST.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shortDesc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-extrabold text-gray-800 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider">
          <Flame className="w-4 h-4 text-rose-500" />
          <span>필수 생활 계산기 전체 바로가기</span>
        </h2>
        <span className="text-xs text-gray-400">총 {filtered.length}개 도구 제공</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((calc) => {
          const isActive = activeCalcId === calc.id;
          return (
            <div
              key={calc.id}
              onClick={() => onSelectCalc(calc.id)}
              className={`group p-6 rounded-2xl border shadow-xs transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'border-blue-500 bg-white dark:bg-slate-900 ring-2 ring-blue-500/20'
                  : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
                    {getIcon(calc.iconName)}
                  </div>
                  {calc.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                      {calc.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {calc.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                  {calc.shortDesc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-gray-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors uppercase tracking-wider">
                <span>계산하기</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform text-gray-400 group-hover:text-blue-600" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
