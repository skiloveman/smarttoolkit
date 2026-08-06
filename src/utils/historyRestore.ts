import { CalculationHistoryItem, CalculationInputState, CalculatorId } from '../types';
import { useEffect } from 'react';

const PENDING_HISTORY_RESTORE_KEY = 'pending_calc_restore';

export const queuePendingHistoryRestore = (item: CalculationHistoryItem) => {
  try {
    sessionStorage.setItem(PENDING_HISTORY_RESTORE_KEY, JSON.stringify(item));
  } catch {
    // Ignore restore queue failures and fall back to plain navigation.
  }
};

export const consumePendingHistoryRestore = <T extends CalculationInputState>(
  calculatorId: CalculatorId
): T | null => {
  try {
    const raw = sessionStorage.getItem(PENDING_HISTORY_RESTORE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CalculationHistoryItem;
    if (parsed.calculatorId !== calculatorId || !parsed.inputState) {
      return null;
    }

    sessionStorage.removeItem(PENDING_HISTORY_RESTORE_KEY);
    return parsed.inputState as T;
  } catch {
    return null;
  }
};

export const usePendingHistoryRestore = <T extends CalculationInputState>(
  calculatorId: CalculatorId,
  applyRestore: (state: T) => void
) => {
  useEffect(() => {
    const restored = consumePendingHistoryRestore<T>(calculatorId);
    if (restored) {
      applyRestore(restored);
    }
  }, []);
};