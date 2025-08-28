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
  showNoCreditsModal: boolean;
  
  // Actions
  setSubscriptionInfo: (info: ISubscriptionInfo) => void;
  setCreditRules: (rules: ICreditRule[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateCredits: (credits: number) => void;
  hasEnoughCredits: (requiredCredits?: number) => boolean;
  checkCreditsAndShowModal: (requiredCredits?: number) => boolean;
  setShowNoCreditsModal: (show: boolean) => void;
  refreshSubscriptionInfo: () => Promise<void>;
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
  showNoCreditsModal: false,
};

export const useSubscriptionStore = create<ISubscriptionState>()(
  persist(
    (set, get) => ({
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
      
      hasEnoughCredits: (requiredCredits = 1) => {
        const state = get();
        return state.credits >= requiredCredits;
      },
      
      checkCreditsAndShowModal: (requiredCredits = 1) => {
        const state = get();
        if (state.credits < requiredCredits) {
          set({ showNoCreditsModal: true });
          return false;
        }
        return true;
      },
      
      setShowNoCreditsModal: (show) =>
        set({ showNoCreditsModal: show }),
      
      refreshSubscriptionInfo: async () => {
        // 调用全局的 refetch 方法（由 SubscriptionSync 组件设置）
        if (typeof window !== 'undefined' && (window as any).refetchSubscriptionInfo) {
          await (window as any).refetchSubscriptionInfo();
        }
      },
      
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