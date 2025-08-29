import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useSubscriptionStore } from '@/stores/subscriptionStore';

const CreditBanner = () => {
  const { showLowCreditsBanner } = useSubscriptionStore();

  const [initCredit, setInitCredit] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setInitCredit(true);
    }, 2000);
  }, []);

  const shouldShowBanner = initCredit && showLowCreditsBanner;

  return shouldShowBanner ? (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <Link
        href={'/subscription'}
        className="flex items-center justify-center bg-black px-[12px] py-[8px] text-white"
      >
        <span className="mr-2 text-[14px]">🔥</span>
        <span className="text-[14px]">
          Low credits left. Upgrade to create freely.
        </span>
      </Link>
    </motion.div>
  ) : null;
};

export default CreditBanner;
