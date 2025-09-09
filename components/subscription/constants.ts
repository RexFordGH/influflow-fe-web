import { PlanType } from '@/lib/api/services';

export const PlanLabelMap: Record<PlanType, string> = {
  free: 'Free Plan',
  starter: 'Starter Plan',
  pro: 'Pro Plan',
  premium: 'Premium Plan',
};

export const PriceMap: Record<PlanType, number> = {
  free: 0,
  starter: 29,
  pro: 59,
  premium: 129,
};

export const CreditMap: Record<PlanType, number> = {
  free: 50,
  starter: 600,
  pro: 1500,
  premium: 5000,
};

export const FreePlanFeatures = [
  'Limited generation',
  `${CreditMap.free} free credits / month`,
  'Great for trying out',
];

export const StarterPlanFeatures = [
  'Larger monthly allowance',
  `${CreditMap.starter} free credits / month`,
  'Perfect for explorers',
];

export const ProPlanFeatures = [
  'Generous credits for heavy usage',
  `${CreditMap.pro} free credits / month`,
  'Best for regular creators',
];

export const PremiumPlanFeatures = [
  'Generous credits for super heavy usage',
  `${CreditMap.premium} free credits / month`,
  'Best for professionals',
];

export const FeatureMap: Record<PlanType, string[]> = {
  free: FreePlanFeatures,
  starter: StarterPlanFeatures,
  pro: ProPlanFeatures,
  premium: PremiumPlanFeatures,
};

// 订阅计划主题色（用于对比卡片等）
export const PlanColorMap: Record<PlanType, string> = {
  free: 'rgb(0, 0, 0)',
  starter: 'rgb(68, 138, 255)',
  pro: 'rgb(101, 99, 255)',
  premium: 'rgb(101, 99, 255)',
};
