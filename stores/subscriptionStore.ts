import { PlanType, ISubscriptionInfo, ICreditRule } from '@/lib/api/services';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ISubscriptionState {
  // 订阅信息
  currentPlan: PlanType;
  nextPlan: PlanType | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  credits: number;
  
  // 积分规则
  creditRules: ICreditRule[];
  
  // UI 状态
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSubscriptionInfo: (info: ISubscriptionInfo) => void;
  setCreditRules: (rules: ICreditRule[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateCredits: (credits: number) => void;
  reset: () => void;
}

const initialState = {
  currentPlan: 'free' as PlanType,
  nextPlan: null,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  credits: 0,
  creditRules: [],
  isLoading: false,
  error: null,
};

export const useSubscriptionStore = create<ISubscriptionState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setSubscriptionInfo: (info) =>
        set({
          currentPlan: info.current_plan,
          nextPlan: info.next_plan !== info.current_plan ? info.next_plan : null,
          currentPeriodStart: info.current_period_start,
          currentPeriodEnd: info.current_period_end,
          credits: info.credit,
          error: null,
        }),
      
      setCreditRules: (rules) =>
        set({
          creditRules: rules,
        }),
      
      setLoading: (loading) =>
        set({ isLoading: loading }),
      
      setError: (error) =>
        set({ error }),
      
      updateCredits: (credits) =>
        set({ credits }),
      
      reset: () =>
        set(initialState),
    }),
    {
      name: 'subscription-storage',
      partialize: (state) => ({
        // 只持久化订阅信息，不持久化 UI 状态
        currentPlan: state.currentPlan,
        nextPlan: state.nextPlan,
        currentPeriodStart: state.currentPeriodStart,
        currentPeriodEnd: state.currentPeriodEnd,
        credits: state.credits,
        creditRules: state.creditRules,
      }),
    },
  ),
);