import dynamic from 'next/dynamic';

const DynamicLottiePlayer = dynamic(() => import('./LottiePlayer'), {
  ssr: false,
});

export default DynamicLottiePlayer;