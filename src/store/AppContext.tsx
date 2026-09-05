import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, DEFAULT_STATE } from '../logic/types';
import { nextDay, streak } from '../logic';
import { configureBilling, getCustomerInfo, isPremium, addPremiumListener } from '../services/billing';
import { scheduleDaily, cancelAll, requestPermission } from '../services/notifications';

export const STORAGE_KEY = 'lantern.state.v1';
const DEV_UNLOCK = process.env.EXPO_PUBLIC_DEV_UNLOCK === '1' || process.env.EXPO_PUBLIC_DEV_UNLOCK === 'true';

type Ctx = {
  ready: boolean;
  state: AppState;
  isPro: boolean;
  setPro: (v: boolean) => void;
  update: (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void;
  completeOnboarding: (setup: Partial<AppState>) => void;
  completeDay: (day: number) => void;
  saveJournal: (day: number, text: string) => void;
  setPracticeCommitted: (day: number, on: boolean) => void;
  logMood: (value: number) => void;
  logStonesDropped: (n: number) => void;
  setReminderTime: (hhmm: string) => void;
  setReminders: (on: boolean) => Promise<boolean>;
  resetAll: () => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [isPro, setIsPro] = useState(DEV_UNLOCK);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load persisted state + billing
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState({ ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<AppState>) });
      } catch {
        /* start fresh */
      }
      configureBilling();
      const info = await getCustomerInfo();
      if (isPremium(info)) setIsPro(true);
      unsub = addPremiumListener((pro) => setIsPro(pro || DEV_UNLOCK));
      setReady(true);
    })();
    return () => unsub();
  }, []);

  // Persist on every change (after initial load)
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const update = useCallback<Ctx['update']>((patch) => {
    setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);

  const completeOnboarding = useCallback((setup: Partial<AppState>) => {
    const now = new Date().toISOString();
    setState((prev) => ({ ...prev, ...setup, onboarded: true, startedAt: now, currentDay: 1 }));
  }, []);

  const completeDay = useCallback((day: number) => {
    setState((prev) => {
      const key = String(day);
      const completedDays = prev.completedDays[key] ? prev.completedDays : { ...prev.completedDays, [key]: new Date().toISOString() };
      const s = streak(completedDays);
      return {
        ...prev,
        completedDays,
        currentDay: nextDay(completedDays),
        longestStreak: Math.max(prev.longestStreak, s),
      };
    });
  }, []);

  const saveJournal = useCallback((day: number, text: string) => {
    setState((prev) => ({ ...prev, journal: { ...prev.journal, [String(day)]: text } }));
  }, []);

  const setPracticeCommitted = useCallback((day: number, on: boolean) => {
    setState((prev) => ({ ...prev, practiceCommitted: { ...prev.practiceCommitted, [String(day)]: on } }));
  }, []);

  const logMood = useCallback((value: number) => {
    setState((prev) => ({ ...prev, moods: [...prev.moods, { at: new Date().toISOString(), value }].slice(-365) }));
  }, []);

  const logStonesDropped = useCallback((n: number) => {
    setState((prev) => ({ ...prev, stonesDropped: prev.stonesDropped + n }));
  }, []);

  const setReminderTime = useCallback((hhmm: string) => {
    setState((prev) => {
      const next = { ...prev, reminderTime: hhmm };
      if (next.remindersEnabled) scheduleDaily(hhmm);
      return next;
    });
  }, []);

  const setReminders = useCallback(async (on: boolean) => {
    if (on) {
      const ok = await requestPermission();
      if (!ok) return false;
      await scheduleDaily(stateRef.current.reminderTime);
      setState((prev) => ({ ...prev, remindersEnabled: true }));
      return true;
    }
    await cancelAll();
    setState((prev) => ({ ...prev, remindersEnabled: false }));
    return false;
  }, []);

  const resetAll = useCallback(async () => {
    await cancelAll();
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    setState(DEFAULT_STATE);
  }, []);

  return (
    <AppCtx.Provider
      value={{
        ready,
        state,
        isPro,
        setPro: (v) => setIsPro(v || DEV_UNLOCK),
        update,
        completeOnboarding,
        completeDay,
        saveJournal,
        setPracticeCommitted,
        logMood,
        logStonesDropped,
        setReminderTime,
        setReminders,
        resetAll,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const v = useContext(AppCtx);
  if (!v) throw new Error('useApp must be used within AppProvider');
  return v;
}
