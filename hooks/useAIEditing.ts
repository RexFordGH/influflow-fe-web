import { useCallback, useState } from 'react';
import { addToast } from '@/components/base/toast';
import {
  useModifyTweet,
} from '@/lib/api/services';
import {
  convertAPIDataToGeneratedContent,
} from '@/lib/data/converters';
import { createClient } from '@/lib/supabase/client';
import { MindmapNodeData } from '@/types/content';
import { Outline } from '@/types/outline';

interface UseAIEditingProps {
  rawAPIData: Outline | null;
  currentNodes: MindmapNodeData[];
  onDataUpdate?: () => void;
  onContentUpdate?: (updatedData: Outline) => void;
}

interface UseAIEditingReturn {
  // 状态
  selectedNodeForAI: string | null;
  showAIEditModal: boolean;
  aiEditInstruction: string;
  isAIProcessing: boolean;
  
  // 方法
  handleEditWithAI: (nodeId: string) => void;
  handleAIEditSubmit: () => Promise<void>;
  closeAIEditModal: () => void;
  setAiEditInstruction: (instruction: string) => void;
}

export function useAIEditing({
  rawAPIData,
  currentNodes,
  onDataUpdate,
  onContentUpdate
}: UseAIEditingProps): UseAIEditingReturn {
  const [selectedNodeForAI, setSelectedNodeForAI] = useState<string | null>(null);
  const [showAIEditModal, setShowAIEditModal] = useState(false);
  const [aiEditInstruction, setAiEditInstruction] = useState('');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  
  const modifyTweetMutation = useModifyTweet();
  
  // 处理 Edit with AI 按钮点击
  const handleEditWithAI = useCallback((nodeId: string) => {
    setSelectedNodeForAI(nodeId);
    setShowAIEditModal(true);
  }, []);
  
  // 处理 AI 编辑指令提交
  const handleAIEditSubmit = useCallback(async () => {
    if (!selectedNodeForAI || !aiEditInstruction.trim() || !rawAPIData) {
      return;
    }
    
    setIsAIProcessing(true);
    
    try {
      // 找到要编辑的节点，获取对应的tweet_number
      const targetNode = currentNodes.find((node) => {
        // 支持多种ID格式匹配
        if (node.id === selectedNodeForAI) return true;
        if (node.data?.tweetId?.toString() === selectedNodeForAI) return true;
        if (
          selectedNodeForAI.startsWith('group-') &&
          node.id === selectedNodeForAI
        ) return true;
        return false;
      });
      
      if (!targetNode || !targetNode.data?.tweetId) {
        console.error('未找到目标节点或缺少tweetId:', selectedNodeForAI);
        setIsAIProcessing(false);
        return;
      }
      
      const tweetNumber = targetNode.data.tweetId;
      
      // 调用 useModifyTweet API
      const result = await modifyTweetMutation.mutateAsync({
        outline: rawAPIData,
        tweet_number: tweetNumber,
        modification_prompt: aiEditInstruction,
      });
      
      // API只返回更新的tweet内容，需要局部更新
      if (result.updated_tweet_content) {
        console.log('AI编辑成功，返回的数据:', result);
        
        // 1. 更新rawAPIData中对应的tweet内容
        const updatedOutline = JSON.parse(
          JSON.stringify(rawAPIData),
        ) as Outline;
        let tweetFound = false;
        
        for (const outlineNode of updatedOutline.nodes) {
          const tweetToUpdate = outlineNode.tweets.find(
            (tweet) => tweet.tweet_number === tweetNumber,
          );
          if (tweetToUpdate) {
            tweetToUpdate.content = result.updated_tweet_content;
            tweetFound = true;
            break;
          }
        }
        
        if (!tweetFound) {
          console.error('未找到对应的tweet_number:', tweetNumber);
          return;
        }
        
        // 2. 通知父组件更新状态
        onContentUpdate?.(updatedOutline);
        
        // 3. 保存到 Supabase
        try {
          const supabase = createClient();
          const { error } = await supabase
            .from('tweet_thread')
            .update({ tweets: updatedOutline.nodes })
            .eq('id', rawAPIData.id);
          
          if (error) {
            throw error;
          }
          console.log('AI edited content saved successfully to Supabase.');
          
          // 成功保存后，触发侧边栏数据刷新
          onDataUpdate?.();
        } catch (saveError) {
          console.error(
            'Error saving AI edited content to Supabase:',
            saveError,
          );
          addToast({
            title: 'Warning',
            description: 'Content updated locally but failed to save to server',
          });
        }
        
        addToast({
          title: 'Success',
          description: 'Content updated successfully',
        });
      }
    } catch (error) {
      console.error('AI编辑失败:', error);
      addToast({
        title: 'Error',
        description: 'Failed to update content',
      });
    } finally {
      setIsAIProcessing(false);
      setShowAIEditModal(false);
      setAiEditInstruction('');
      setSelectedNodeForAI(null);
    }
  }, [
    selectedNodeForAI,
    aiEditInstruction,
    rawAPIData,
    currentNodes,
    modifyTweetMutation,
    onDataUpdate,
    onContentUpdate,
  ]);
  
  // 关闭 AI 编辑模态框
  const closeAIEditModal = useCallback(() => {
    setShowAIEditModal(false);
    setSelectedNodeForAI(null);
    setAiEditInstruction('');
  }, []);
  
  return {
    // 状态
    selectedNodeForAI,
    showAIEditModal,
    aiEditInstruction,
    isAIProcessing,
    
    // 方法
    handleEditWithAI,
    handleAIEditSubmit,
    closeAIEditModal,
    setAiEditInstruction,
  };
}