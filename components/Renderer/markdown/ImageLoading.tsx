import { ImageLoadingAnimation } from '@/components/ui/ImageLoadingAnimation';

const ImageLoading = () => {
  return (
    <div className="my-4 flex flex-col items-center justify-center gap-[5px]">
      <ImageLoadingAnimation size={160} />
      <span className="text-sm text-gray-500">Generating image...</span>
    </div>
  );
};

export default ImageLoading;
