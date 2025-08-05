import { addToast } from '@/components/base/toast';
import { getErrorMessage, useGenerateImage } from '@/lib/api/services';
import { createClient } from '@/lib/supabase/client';
import { IOutline } from '@/types/outline';
import { useCallback, useEffect, useState } from 'react';

interface CollectedImage {
  src: string;
  alt: string;
  originalSectionId: string;
  tweetId?: string;
}

interface EditingImage {
  url: string;
  alt: string;
  caption?: string;
  prompt?: string;
}

interface UseImageManagementProps {
  rawAPIData: IOutline | null;
  contentFormat?: string;
  onDataUpdate?: () => void;
  onContentUpdate?: (data: IOutline) => void;
}

interface UseImageManagementReturn {
  // 状态
  collectedImages: CollectedImage[];
  localImageUrls: Record<string, string>;
  generatingImageTweetIds: string[];
  isImageEditModalOpen: boolean;
  editingImage: EditingImage | null;
  editingTweetData: any | null;
  isDeleteModalOpen: boolean;
  imageToDelete: CollectedImage | null;
  isDeletingImage: boolean;

  // 方法
  handleImageClick: (image: any) => void;
  handleImageUpdate: (updatedImage: any, tweetData?: any) => Promise<void>;
  handleDeleteImage: (image: CollectedImage) => void;
  confirmDeleteImage: () => Promise<void>;
  handleLocalImageUpload: (
    result: { url: string; alt: string },
    tweetData: any,
  ) => void;
  handleDirectGenerate: (tweetData: any) => Promise<void>;
  handleImageSelect: (
    result: { localUrl: string; file: File },
    tweetData: any,
  ) => void;
  handleTweetImageEdit: (tweetData: any) => void;
  setIsImageEditModalOpen: (isOpen: boolean) => void;
  setEditingImage: (image: EditingImage | null) => void;
  setEditingTweetData: (data: any | null) => void;
  setIsDeleteModalOpen: (isOpen: boolean) => void;

  // 辅助方法
  isGeneratingImage: (tweetId: string | null | undefined) => boolean;
  addGeneratingImageTweetId: (tweetId: string) => void;
  removeGeneratingImageTweetId: (tweetId: string) => void;
  clearGeneratingImageTweetIds: () => void;
}

export function useImageManagement({
  rawAPIData,
  contentFormat,
  onDataUpdate,
  onContentUpdate,
}: UseImageManagementProps): UseImageManagementReturn {
  const [collectedImages, setCollectedImages] = useState<CollectedImage[]>([]);
  const [localImageUrls, setLocalImageUrls] = useState<Record<string, string>>(
    {},
  );
  const [generatingImageTweetIds, setGeneratingImageTweetIds] = useState<
    string[]
  >([]);
  const [isImageEditModalOpen, setIsImageEditModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<EditingImage | null>(null);
  const [editingTweetData, setEditingTweetData] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<CollectedImage | null>(
    null,
  );
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  // API mutation
  const generateImageMutation = useGenerateImage();

  // 从 rawAPIData 中收集图片
  useEffect(() => {
    if (contentFormat !== 'longform' || !rawAPIData) {
      setCollectedImages([]);
      return;
    }

    const images: CollectedImage[] = [];
    rawAPIData.nodes.forEach((group: any) => {
      if (group.tweets && Array.isArray(group.tweets)) {
        group.tweets.forEach((tweet: any) => {
          if (tweet.image_url) {
            images.push({
              src: tweet.image_url,
              alt: tweet.content || tweet.title || 'Image',
              originalSectionId: `tweet-${tweet.tweet_number}`,
              tweetId: tweet.tweet_number.toString(),
            });
          }
        });
      }
    });
    setCollectedImages(images);
  }, [rawAPIData, contentFormat]);

  // 重置本地图片URLs当数据变化时
  useEffect(() => {
    setLocalImageUrls({});
  }, [rawAPIData]);

  // 辅助函数：添加正在生图的 tweetId
  const addGeneratingImageTweetId = useCallback((tweetId: string) => {
    setGeneratingImageTweetIds((prev) => [
      ...prev.filter((id) => id !== tweetId),
      tweetId,
    ]);
  }, []);

  // 辅助函数：移除正在生图的 tweetId
  const removeGeneratingImageTweetId = useCallback((tweetId: string) => {
    setGeneratingImageTweetIds((prev) => prev.filter((id) => id !== tweetId));
  }, []);

  // 辅助函数：清空所有正在生图的 tweetId
  const clearGeneratingImageTweetIds = useCallback(() => {
    setGeneratingImageTweetIds([]);
  }, []);

  // 辅助函数：检查是否正在生图
  const isGeneratingImage = useCallback(
    (tweetId: string | null | undefined) => {
      return tweetId ? generatingImageTweetIds.includes(tweetId) : false;
    },
    [generatingImageTweetIds],
  );

  // 处理图片点击事件
  const handleImageClick = useCallback(
    (image: {
      url: string;
      alt: string;
      caption?: string;
      prompt?: string;
    }) => {
      setEditingImage(image);
      setIsImageEditModalOpen(true);
    },
    [],
  );

  // 处理tweet图片编辑
  const handleTweetImageEdit = useCallback(
    (tweetData: any) => {
      setEditingTweetData(tweetData);
      setEditingImage({
        url: tweetData.image_url || '',
        alt: tweetData.content || tweetData.title || '',
        caption: tweetData.content,
        prompt: tweetData.content || tweetData.title,
      });
      const tweetId = tweetData.tweet_number?.toString();
      if (tweetId) {
        addGeneratingImageTweetId(tweetId);
      }
      setIsImageEditModalOpen(true);
    },
    [addGeneratingImageTweetId],
  );

  // 处理图片更新
  const handleImageUpdate = useCallback(
    async (
      newImage: {
        url: string;
        alt: string;
        caption?: string;
        prompt?: string;
      },
      tweetData?: any,
    ) => {
      const targetTweetData = tweetData || editingTweetData;

      if (!targetTweetData) {
        console.error(
          'handleImageUpdate: tweetData 和 editingTweetData 都为空',
        );
        return;
      }

      const { tweet_number } = targetTweetData;

      let latestRawAPIData: any = null;

      // 更新 rawAPIData
      if (rawAPIData) {
        const updatedNodes = rawAPIData.nodes.map((group: any) => ({
          ...group,
          tweets: group.tweets.map((tweet: any) =>
            tweet.tweet_number === tweet_number
              ? { ...tweet, image_url: newImage.url }
              : tweet,
          ),
        }));

        latestRawAPIData = { ...rawAPIData, nodes: updatedNodes };

        // 通过回调更新父组件的 rawAPIData
        onContentUpdate?.(latestRawAPIData);

        // 更新 Supabase 数据库
        if (latestRawAPIData.id) {
          try {
            const supabase = createClient();
            const { error } = await supabase
              .from('tweet_thread')
              .update({ tweets: latestRawAPIData.nodes })
              .eq('id', latestRawAPIData.id);

            if (error) throw error;

            console.log('Tweet image updated successfully in Supabase.');
            onDataUpdate?.();
          } catch (error) {
            console.error('Error updating tweet image in Supabase:', error);
          }
        }
      }

      // 关闭模态框并重置状态
      setIsImageEditModalOpen(false);
      setEditingImage(null);

      if (!tweetData) {
        setEditingTweetData(null);
      }

      // 清除生图高亮状态
      const currentTweetId = (
        tweetData || editingTweetData
      )?.tweet_number?.toString();
      if (currentTweetId) {
        removeGeneratingImageTweetId(currentTweetId);
      }

      // 清理本地预览URL
      const localUrl = localImageUrls[targetTweetData.tweet_number];
      if (localUrl) {
        URL.revokeObjectURL(localUrl);
        setLocalImageUrls((prev) => {
          const newUrls = { ...prev };
          delete newUrls[targetTweetData.tweet_number];
          return newUrls;
        });
      }
    },
    [
      editingTweetData,
      rawAPIData,
      onDataUpdate,
      onContentUpdate,
      removeGeneratingImageTweetId,
      localImageUrls,
    ],
  );

  // 处理本地图片选择
  const handleImageSelect = useCallback(
    (result: { localUrl: string; file: File }, tweetData: any) => {
      setLocalImageUrls((prev) => ({
        ...prev,
        [tweetData.tweet_number]: result.localUrl,
      }));
    },
    [],
  );

  // 处理本地图片上传
  const handleLocalImageUpload = useCallback(
    (result: { url: string; alt: string }, tweetData: any) => {
      handleImageUpdate(result, tweetData);
    },
    [handleImageUpdate],
  );

  // 处理直接生成图片
  const handleDirectGenerate = useCallback(
    async (tweetData: any) => {
      if (!tweetData) return;

      const tweetId = tweetData.tweet_number?.toString();
      if (!tweetId) return;

      addGeneratingImageTweetId(tweetId);

      try {
        const imageUrl = await generateImageMutation.mutateAsync({
          target_tweet: tweetData.content || tweetData.title || '',
          tweet_thread: rawAPIData
            ? rawAPIData.nodes
                .flatMap((group: any) => group.tweets)
                .map(
                  (tweet: any, index: number) =>
                    `(${index + 1}) ${tweet.content || tweet.title}`,
                )
                .join(' \n')
            : '',
        });

        const newImage = {
          url: imageUrl,
          alt: tweetData.content || tweetData.title || '',
          caption: tweetData.content,
          prompt: tweetData.content || tweetData.title,
        };

        await handleImageUpdate(newImage, tweetData);

        addToast({
          title: 'Image generated successfully',
          color: 'success',
        });
      } catch (error) {
        console.error('Direct image generation failed:', error);
        addToast({
          title: 'Image generation failed',
          color: 'danger',
        });
      } finally {
        removeGeneratingImageTweetId(tweetId);
      }
    },
    [
      rawAPIData,
      generateImageMutation,
      handleImageUpdate,
      addGeneratingImageTweetId,
      removeGeneratingImageTweetId,
    ],
  );

  // 处理删除图片
  const handleDeleteImage = useCallback(
    (image: CollectedImage) => {
      console.log('handleDeleteImage called. Image:', image);
      if (!rawAPIData) {
        console.error('Cannot delete image: rawAPIData is not available.');
        addToast({
          title: '无法删除图片',
          description: '缺少必要的数据，请稍后重试。',
          color: 'danger',
        });
        return;
      }
      setImageToDelete(image);
      setIsDeleteModalOpen(true);
    },
    [rawAPIData],
  );

  // 确认删除图片
  const confirmDeleteImage = useCallback(async () => {
    if (!imageToDelete || !rawAPIData) return;

    setIsDeletingImage(true);

    const targetTweetId = imageToDelete.tweetId;
    if (!rawAPIData.id || !targetTweetId) {
      console.error('cannot delete image: missing necessary data');
      setIsDeletingImage(false);
      return;
    }

    // 更新 rawAPIData
    const updatedNodes = rawAPIData.nodes.map((group: any) => ({
      ...group,
      tweets: group.tweets.map((tweet: any) => {
        if (tweet.tweet_number.toString() === targetTweetId) {
          return { ...tweet, image_url: null };
        }
        return tweet;
      }),
    }));

    const updatedRawAPIData = { ...rawAPIData, nodes: updatedNodes };

    // 通过回调更新父组件的 rawAPIData
    onContentUpdate?.(updatedRawAPIData);

    // 更新 Supabase
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tweet_thread')
        .update({ tweets: updatedRawAPIData.nodes })
        .eq('id', rawAPIData.id);

      if (error) throw error;

      addToast({ title: 'Image deleted successfully', color: 'success' });
      onDataUpdate?.();
    } catch (error) {
      console.error('Delete image failed:', error);
      addToast({
        title: 'Delete failed',
        description: getErrorMessage(error),
        color: 'danger',
      });
    } finally {
      setIsDeleteModalOpen(false);
      setImageToDelete(null);
      setIsDeletingImage(false);
    }
  }, [rawAPIData, imageToDelete, onDataUpdate, onContentUpdate]);

  return {
    // 状态
    collectedImages,
    localImageUrls,
    generatingImageTweetIds,
    isImageEditModalOpen,
    editingImage,
    editingTweetData,
    isDeleteModalOpen,
    imageToDelete,
    isDeletingImage,

    // 方法
    handleImageClick,
    handleImageUpdate,
    handleDeleteImage,
    confirmDeleteImage,
    handleLocalImageUpload,
    handleDirectGenerate,
    handleImageSelect,
    handleTweetImageEdit,
    setIsImageEditModalOpen,
    setEditingImage,
    setEditingTweetData,
    setIsDeleteModalOpen,

    // 辅助方法
    isGeneratingImage,
    addGeneratingImageTweetId,
    removeGeneratingImageTweetId,
    clearGeneratingImageTweetIds,
  };
}
