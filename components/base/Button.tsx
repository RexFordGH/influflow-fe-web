'use client';

import { ButtonProps, Button as HeroUIButton } from '@heroui/react';
import { forwardRef } from 'react';

// 扩展HeroUI Button的props
interface CustomButtonProps extends ButtonProps {
  // 可以在这里添加自定义props
}

// 基础Button组件，包装HeroUI Button并添加默认样式
export const Button = forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ className, ...props }, ref) => {
    return <HeroUIButton ref={ref} className={className} {...props} />;
  },
);

Button.displayName = 'Button';
