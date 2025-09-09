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
  'Great for trying out and exploring',
];

export const StarterPlanFeatures = [
  'Larger monthly allowance',
  `${CreditMap.starter} credits / month`,
  'Perfect for regular creators',
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
