import { PlanType } from '@/lib/api/services';

export const PlanLabelMap: Record<PlanType, string> = {
  free: 'Free Plan',
  starter: 'Starter Plan',
  pro: 'Pro Plan',
};

export const PriceMap: Record<PlanType, number> = {
  free: 0,
  starter: 29,
  pro: 59,
};

export const CreditMap: Record<PlanType, number> = {
  free: 50,
  starter: 600,
  pro: 1500,
};

export const FreePlanFeatures = [
  'Limited generation',
  `${CreditMap.free} free credits / month`,
  'Access to all features',
  'Great for trying out and exploring',
];

export const StarterPlanFeatures = [
  'Larger monthly allowance',
  `${CreditMap.starter} credits / month`,
  'Access to all features',
  'Perfect for regular creators',
];

export const ProPlanFeatures = [
  'Generous credits for heavy usage',
  `${CreditMap.pro} credits / month`,
  'Access to all features',
  'Best for professionals',
];

export const FeatureMap: Record<PlanType, string[]> = {
  free: FreePlanFeatures,
  starter: StarterPlanFeatures,
  pro: ProPlanFeatures,
};
