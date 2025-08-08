'use client';

import { motion, useTransform } from 'framer-motion';
import React from 'react';

export const ScrollProgressIndicator: React.FC<{
  scrollProgress: any;
}> = ({ scrollProgress }) => {
  const scaleX = useTransform(scrollProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-black"
      style={{ scaleX }}
    />
  );
};
