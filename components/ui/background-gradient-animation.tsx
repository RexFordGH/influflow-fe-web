'use client';
import { cn } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';

export const BackgroundGradientAnimation = ({
  gradientBackgroundStart = 'rgb(255, 255, 255)',
  gradientBackgroundEnd = 'rgb(255, 255, 255)',
  firstColor = '68, 138, 255',
  secondColor = '68, 138, 255',
  thirdColor = '255, 153, 156',
  fourthColor = '255, 153, 156',
  fifthColor = '255, 160, 64',
  pointerColor = '255, 153, 156',
  size = '55%',
  blendingValue = 'hard-light',
  children,
  className,
  interactive = true,
  containerClassName,
}: {
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  fifthColor?: string;
  pointerColor?: string;
  size?: string;
  blendingValue?: string;
  children?: React.ReactNode;
  className?: string;
  interactive?: boolean;
  containerClassName?: string;
}) => {
  const interactiveRef = useRef<HTMLDivElement>(null);
  const curXRef = useRef(0);
  const curYRef = useRef(0);

  const [curX, setCurX] = useState(0);
  const [curY, setCurY] = useState(0);
  const [tgX, setTgX] = useState(0);
  const [tgY, setTgY] = useState(0);
  useEffect(() => {
    document.body.style.setProperty(
      '--gradient-background-start',
      gradientBackgroundStart,
    );
    document.body.style.setProperty(
      '--gradient-background-end',
      gradientBackgroundEnd,
    );
    document.body.style.setProperty('--first-color', firstColor);
    document.body.style.setProperty('--second-color', secondColor);
    document.body.style.setProperty('--third-color', thirdColor);
    document.body.style.setProperty('--fourth-color', fourthColor);
    document.body.style.setProperty('--fifth-color', fifthColor);
    document.body.style.setProperty('--pointer-color', pointerColor);
    document.body.style.setProperty('--size', size);
    document.body.style.setProperty('--blending-value', blendingValue);
  }, []);

  useEffect(() => {
    let animationFrame: number;

    function move() {
      if (!interactiveRef.current) {
        return;
      }

      // 使用 ref 来避免状态更新导致的无限循环
      curXRef.current = curXRef.current + (tgX - curXRef.current) / 20;
      curYRef.current = curYRef.current + (tgY - curYRef.current) / 20;

      // 更新 DOM 样式
      const transform = `translate(${Math.round(curXRef.current)}px, ${Math.round(curYRef.current)}px)`;
      interactiveRef.current.style.transform = transform;

      // 调试信息
      //   if (Math.abs(tgX - curXRef.current) > 1 || Math.abs(tgY - curYRef.current) > 1) {
      //     console.log('Animation update:', {
      //       tgX,
      //       tgY,
      //       curX: curXRef.current,
      //       curY: curYRef.current,
      //       transform
      //     });
      //   }

      // 继续动画循环
      animationFrame = requestAnimationFrame(move);
    }

    move();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [tgX, tgY]);

  // 添加全局鼠标事件监听器
  useEffect(() => {
    if (!interactive) return;

    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (interactiveRef.current) {
        const rect = interactiveRef.current.getBoundingClientRect();
        const newTgX = event.clientX - rect.left;
        const newTgY = event.clientY - rect.top;

        // console.log('Global mouse move:', {
        //   clientX: event.clientX,
        //   clientY: event.clientY,
        //   rect: { left: rect.left, top: rect.top },
        //   newTgX,
        //   newTgY
        // });

        setTgX(newTgX);
        setTgY(newTgY);
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [interactive]);

  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  return (
    <div
      className={cn(
        'h-screen w-screen relative overflow-hidden top-0 left-0 bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))]',
        containerClassName,
      )}
    >
      <svg className="hidden">
        <defs>
          <filter id="blurMe">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div className={cn('', className)}>{children}</div>
      <div
        className={cn(
          'gradients-container h-full w-full blur-lg',
          isSafari ? 'blur-2xl' : '[filter:url(#blurMe)_blur(40px)]',
        )}
      >
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_var(--first-color)_0,_var(--first-color)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[750px] h-[750px] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
            `[transform-origin:center_center]`,
            `animate-first`,
            `opacity-100`,
          )}
        ></div>
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[750px] h-[750px] top-[calc(50%-325)] left-[calc(55%-var(--size)/2)]`,
            `[transform-origin:calc(50%-90px)]`,
            `animate-second`,
            `opacity-100`,
          )}
        ></div>
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.8)_0,_rgba(var(--third-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[450px] h-[450px] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
            `[transform-origin:calc(40%-70px)]`,
            `animate-third`,
            `opacity-100`,
          )}
        ></div> 
        {/* <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[250px] h-[250px]  top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
            `[transform-origin:calc(60%+90px)]`,
            `animate-fourth`,
            `opacity-70`,
          )}
        ></div> */}
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat]`,
            `[mix-blend-mode:var(--blending-value)] w-[250px] h-[250px] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]`,
            `[transform-origin:calc(50%-50px)_calc(50%+50px)]`,
            `animate-fifth`,
            `opacity-100`,
          )}
        ></div>

        {interactive && (
          <div
            ref={interactiveRef}
            className={cn(
              `absolute [background:radial-gradient(circle_at_center,_rgba(var(--pointer-color),_0.8)_0,_rgba(var(--pointer-color),_0)_50%)_no-repeat]`,
              `[mix-blend-mode:var(--blending-value)]  w-[450px] h-[450px]`,
              `opacity-70`,
            )}
            style={{ zIndex: 1 }}
          ></div>
        )}
      </div>
    </div>
  );
};
