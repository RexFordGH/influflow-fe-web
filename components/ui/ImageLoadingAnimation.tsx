import imageLoadingAnimationData from '@/public/lottie/imageLoading.json';

import DynamicLottiePlayer from './DynamicLottiePlayer';

interface ImageLoadingAnimationProps {
  size?: number;
  className?: string;
}

export function ImageLoadingAnimation({
  size = 200,
  className = '',
}: ImageLoadingAnimationProps) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-[12px] ${className}`}
    >
      <DynamicLottiePlayer
        animationData={imageLoadingAnimationData}
        loop={true}
        autoplay={true}
        style={{ width: size, height: size }}
      />
    </div>
  );
}
