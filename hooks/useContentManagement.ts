import { addToast } from '@/components/base/toast';
import { useModifyOutline } from '@/lib/api/services';
import {
  convertAPIDataToGeneratedContent,
  convertThreadDataToMindmap,
} from '@/lib/data/converters';
import { createClient } from '@/lib/supabase/client';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import {
  GeneratedContent,
  MindmapEdgeData,
  MindmapNodeData,
} from '@/types/content';
import { IOutline, ITweetContentItem } from '@/types/outline';
import { useCallback, useState } from 'react';

interface UseContentManagementProps {
  rawAPIData: IOutline | null;
  currentNodes: MindmapNodeData[];
  currentEdges: MindmapEdgeData[];
  generatedContent: GeneratedContent | null;
  onDataUpdate?: () => void;
  onContentUpdate?: (data: IOutline) => void;
  onNodesUpdate?: (nodes: MindmapNodeData[], edges: MindmapEdgeData[]) => void;
}

interface UseContentManagementReturn {
  // 状态
  isRegenerating: boolean;
  loadingTweetId: string | null;

  // 方法
  handleRegenerateClick: () => Promise<void>;
  handleTweetContentChange: (
    tweetId: string,
    newContent: string,
  ) => Promise<void>;
  handleGroupTitleChange: (groupId: string, newTitle: string) => Promise<void>;
  saveToSupabase: (data: IOutline) => Promise<void>;

  // 数据转换
  convertToGeneratedContent: (data: IOutline) => GeneratedContent;
  updateLocalState: (data: IOutline) => void;
}

export function useContentManagement({
  rawAPIData,
  currentNodes,
  currentEdges,
  generatedContent,
  onDataUpdate,
  onContentUpdate,
  onNodesUpdate,
}: UseContentManagementProps): UseContentManagementReturn {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [loadingTweetId, setLoadingTweetId] = useState<string | null>(null);

  const { refreshSubscriptionInfo } = useSubscriptionStore();

  const modifyOutlineMutation = useModifyOutline();

  // 保存到 Supabase
  const saveToSupabase = useCallback(async (data: IOutline) => {
    if (!data.id) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tweet_thread')
        .update({
          tweets: data.nodes,
          topic: data.topic,
          content_format: data.content_format,
        })
        .eq('id', data.id);

      if (error) throw error;

      console.log('Data saved successfully to Supabase');
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      throw error;
    }
  }, []);

  // 数据转换方法
  const convertToGeneratedContent = useCallback(
    (data: IOutline): GeneratedContent => {
      return convertAPIDataToGeneratedContent(data);
    },
    [],
  );

  // 更新本地状态
  const updateLocalState = useCallback(
    (data: IOutline) => {
      onContentUpdate?.(data);

      // 重新构建思维导图
      const { nodes: newNodes, edges: newEdges } =
        convertThreadDataToMindmap(data);
      onNodesUpdate?.(newNodes, newEdges);
    },
    [onContentUpdate, onNodesUpdate],
  );

  // 处理重新生成
  const handleRegenerateClick = useCallback(async () => {
    console.log('rawAPIData:', rawAPIData);
    console.log('currentNodes:', currentNodes);

    if (!rawAPIData) {
      console.error('cannot regenerate: missing necessary data');
      return;
    }

    console.log('start setting loading state...');
    setIsRegenerating(true);

    try {
      // 从当前思维导图状态构建新的 outline 结构
      const currentOutlineFromMindmap = {
        id: rawAPIData.id,
        topic: rawAPIData.topic,
        content_format: rawAPIData.content_format || ('longform' as const),
        nodes: rawAPIData.nodes,
        total_tweets: rawAPIData.total_tweets,
      };

      // 构建包含用户编辑的新 outline 结构
      const newOutlineStructure = { ...currentOutlineFromMindmap };

      // 更新主题（如果主题节点被编辑了）
      const topicNode = currentNodes.find((n) => n.type === 'topic');
      if (topicNode) {
        newOutlineStructure.topic = topicNode.label;
      }

      // 更新大纲点和tweets
      const outlineNodes = currentNodes.filter(
        (n) => n.type === 'outline_point',
      );
      const tweetNodes = currentNodes.filter((n) => n.type === 'tweet');

      // 重新构建 nodes 数组
      newOutlineStructure.nodes = outlineNodes.map((outlineNode) => {
        const outlineIndex = outlineNode.data?.outlineIndex;
        const originalNode = rawAPIData.nodes[outlineIndex!] || { tweets: [] };

        // 找到属于这个 outline 的所有 tweets
        const relatedTweets = tweetNodes
          .filter((t) => t.data?.groupIndex === outlineIndex)
          .map((tweetNode) => {
            const originalTweet =
              originalNode.tweets.find(
                (t) => t.tweet_number === tweetNode.data?.tweetId,
              ) || {};

            // 检查标题是否发生变化
            const originalTitle = (originalTweet as any).title;
            const currentTitle = tweetNode.label;
            const titleChanged = currentTitle !== originalTitle;

            console.log('🔍 标题变化检测:', {
              tweetId: tweetNode.data?.tweetId,
              originalTitle,
              currentTitle,
              titleChanged,
              originalTweet,
            });

            const result = {
              ...(originalTweet as ITweetContentItem),
              title: tweetNode.label,
              tweet_number: tweetNode.data?.tweetId || 0,
              // 如果标题变化了，清空 content，让后端重新生成
              ...(titleChanged && { content: '' }),
            };

            console.log('🔍 构建的推文数据:', result);

            return result;
          });

        return {
          ...originalNode,
          title: outlineNode.label,
          tweets: relatedTweets,
        };
      });

      console.log('调用 modify-outline API with:', {
        original_outline: rawAPIData,
        new_outline_structure: newOutlineStructure,
      });

      // 调用 modify-outline API
      const result = await modifyOutlineMutation.mutateAsync({
        original_outline: rawAPIData,
        new_outline_structure: newOutlineStructure,
      });

      if (result.updated_outline) {
        console.log('Regenerate 成功，返回的数据:', result);

        const newOutline = result.updated_outline;
        console.log('新的 outline 数据结构:', {
          id: newOutline.id,
          topic: newOutline.topic,
          nodes: newOutline.nodes?.length,
          total_tweets: newOutline.total_tweets,
          content_format: newOutline.content_format,
        });

        // 保存最新数据到 Supabase
        try {
          await saveToSupabase(newOutline);

          console.log('最新数据已保存到 Supabase');

          // 更新所有状态
          updateLocalState(newOutline);

          // 触发侧边栏数据刷新
          onDataUpdate?.();
        } catch (dbError) {
          console.error(
            '保存数据到 Supabase 失败，但仍使用 API 返回的数据:',
            dbError,
          );

          // 如果数据库保存失败，仍使用 API 返回的数据更新本地状态
          updateLocalState(newOutline);
        }
      }
    } catch (error) {
      console.error('Regenerate 失败:', error);
    } finally {
      refreshSubscriptionInfo();
      setIsRegenerating(false);
    }
  }, [
    rawAPIData,
    currentNodes,
    modifyOutlineMutation,
    saveToSupabase,
    updateLocalState,
    onDataUpdate,
    refreshSubscriptionInfo,
  ]);

  // 处理推文内容修改
  const handleTweetContentChange = useCallback(
    async (tweetId: string, newContent: string) => {
      console.log('handleTweetContentChange', tweetId, newContent, rawAPIData);
      if (!rawAPIData || !rawAPIData.id) return;

      setLoadingTweetId(tweetId);

      try {
        // 更新 rawAPIData 状态
        const updatedNodes = rawAPIData.nodes.map((group: any) => ({
          ...group,
          tweets: group.tweets.map((tweet: any) =>
            tweet.tweet_number.toString() === tweetId
              ? { ...tweet, content: newContent }
              : tweet,
          ),
        }));
        const updatedRawAPIData = { ...rawAPIData, nodes: updatedNodes };

        // 更新本地状态
        onContentUpdate?.(updatedRawAPIData);

        // 更新 Supabase
        await saveToSupabase(updatedRawAPIData);

        console.log('Tweet content updated successfully in Supabase.');

        // 成功更新后，触发侧边栏数据刷新
        onDataUpdate?.();
      } catch (error) {
        console.error('Error updating tweet content:', error);
        addToast({
          title: 'Error',
          description: 'Failed to update tweet content',
          color: 'danger',
        });
      } finally {
        setLoadingTweetId(null);
      }
    },
    [rawAPIData, onDataUpdate, onContentUpdate, saveToSupabase],
  );

  // 处理分组标题修改
  const handleGroupTitleChange = useCallback(
    async (groupId: string, newTitle: string) => {
      if (!rawAPIData || !rawAPIData.id) return;

      try {
        const updatedNodes = rawAPIData.nodes.map(
          (group: any, index: number) => {
            if (group.group_id === groupId || index.toString() === groupId) {
              return { ...group, title: newTitle };
            }
            return group;
          },
        );

        const updatedRawAPIData = { ...rawAPIData, nodes: updatedNodes };

        // 更新本地状态
        onContentUpdate?.(updatedRawAPIData);

        // 更新 Supabase
        await saveToSupabase(updatedRawAPIData);

        console.log('Group title updated successfully in Supabase.');
        onDataUpdate?.();
      } catch (error) {
        console.error('Error updating group title:', error);
        addToast({
          title: 'Error',
          description: 'Failed to update group title',
          color: 'danger',
        });
      }
    },
    [rawAPIData, onDataUpdate, onContentUpdate, saveToSupabase],
  );

  return {
    // 状态
    isRegenerating,
    loadingTweetId,

    // 方法
    handleRegenerateClick,
    handleTweetContentChange,
    handleGroupTitleChange,
    saveToSupabase,

    // 数据转换
    convertToGeneratedContent,
    updateLocalState,
  };
}
