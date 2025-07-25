'use client';

import { Button, cn, Image, Tooltip } from '@heroui/react';
import { useRef, useState } from 'react';

import { addToast } from '@/components/base/toast';
import { markdownStyles } from '@/components/Renderer/markdown/markdownStyles';

interface LocalImageUploaderProps {
  onImageSelect?: (
    result: { localUrl: string; file: File },
    tweetData: any,
  ) => void;
  onUploadSuccess: (
    result: { url: string; alt: string },
    tweetData: any,
  ) => void;
  tweetData: any;
}

export const LocalImageUploader: React.FC<LocalImageUploaderProps> = ({
  onImageSelect,
  onUploadSuccess,
  tweetData,
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (onImageSelect) {
        const localUrl = URL.createObjectURL(file);
        onImageSelect({ localUrl, file }, tweetData);
      }
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Image upload failed');
        }

        const result = await response.json();
        onUploadSuccess({ url: result.imageUrl, alt: file.name }, tweetData);
        // addToast({ title: 'Image uploaded successfully', color: 'success' });
      } catch (error) {
        console.error('Upload error:', error);
        addToast({ title: 'Image upload failed', color: 'danger' });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/png, image/jpeg, image/gif, image/webp"
      />
      <Tooltip
        content="Upload Image"
        delay={50}
        closeDelay={0}
        placement="top"
        classNames={{
          content: 'bg-black text-white',
          arrow: 'bg-black border-black',
        }}
      >
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className={cn(markdownStyles.source.button)}
          onPress={handleUploadButtonClick}
          isLoading={uploading}
          disabled={uploading}
        >
          <Image
            src="/icons/uploadImage.svg"
            alt="upload"
            width={20}
            height={20}
          />
        </Button>
      </Tooltip>
    </>
  );
};
