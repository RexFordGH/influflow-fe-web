"use client";

import Lottie, { LottieComponentProps } from "lottie-react";
import { FC } from "react";

interface LottiePlayerProps extends LottieComponentProps {
  animationData: any;
}

const LottiePlayer: FC<LottiePlayerProps> = ({ animationData, ...props }) => {
  return <Lottie animationData={animationData} {...props} />;
};

export default LottiePlayer;