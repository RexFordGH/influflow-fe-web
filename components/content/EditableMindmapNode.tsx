'use client';

import { PlusIcon } from '@heroicons/react/24/outline';
import { Input } from '@heroui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';

import 'reactflow/dist/style.css';

const EditableMindmapNode = ({
  data,
  id,
  selected,
}: {
  data: any;
  id: string;
  selected: boolean;
}) => {
  const { label, level, onEdit, addChildNode, onNodeHover, hoveredTweetId } =
    data;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  // 根据层级确定样式
  const getNodeStyle = () => {
    const baseStyle =
      'min-w-[120px] max-w-[250px] min-h-[37px] px-[12px] py-[8px] rounded-[12px] transition-all duration-200 cursor-pointer relative group border-none outline-none text-[12px] font-[500]';

    const levelColors = {
      1: 'bg-[#000000] text-white text-center min-w-[180px] hover:bg-[rgba(0,0,0,0.6)]',
      2: 'bg-[#E3E3E3] text-black hover:bg-[#DDE9FF]',
      3: 'bg-[#E3E3E3] text-black hover:bg-[#DDE9FF]',
      4: 'bg-[#E3E3E3] text-black hover:bg-[#DDE9FF]',
      5: 'bg-[#E3E3E3] text-black hover:bg-[#DDE9FF]',
      6: 'bg-[#E3E3E3] text-black hover:bg-[#DDE9FF]',
    };

    const levelStyle =
      levelColors[level as keyof typeof levelColors] || levelColors[6];
    // 使用我们自定义的选中状态，而不是React Flow的原生selected状态
    const isCustomSelected = data.selectedNodeForAI === id;
    const selectedStyle = isCustomSelected
      ? 'ring-2 ring-blue-400 ring-offset-1 bg-[#DDE9FF]'
      : '';

    // Debug: 输出选中状态
    if (isCustomSelected) {
      console.log(
        `✅ Node ${id} is CUSTOM SELECTED, selectedNodeForAI=${data.selectedNodeForAI}`,
      );
    }

    // 检查是否应该高亮（基于hoveredTweetId） - 增强匹配逻辑
    const isTweetHovered =
      hoveredTweetId &&
      data.tweetId !== undefined &&
      (data.tweetId.toString() === hoveredTweetId.toString() ||
        data.tweetId === Number(hoveredTweetId) ||
        data.tweetId.toString() === hoveredTweetId);

    const isGroupHovered =
      hoveredTweetId &&
      hoveredTweetId.startsWith('group-') &&
      data.outlineIndex !== undefined &&
      (data.outlineIndex.toString() === hoveredTweetId.replace('group-', '') ||
        data.outlineIndex === Number(hoveredTweetId.replace('group-', '')));

    const isDirectHovered = hoveredTweetId === id; // 直接ID匹配
    const isHovered = isTweetHovered || isGroupHovered || isDirectHovered;

    // Debug信息 - 帮助排查对应关系
    if (
      hoveredTweetId &&
      (data.tweetId !== undefined || data.outlineIndex !== undefined)
    ) {
      console.log(`Node ${id} matching:`, {
        hoveredTweetId,
        nodeTweetId: data.tweetId,
        nodeOutlineIndex: data.outlineIndex,
        isTweetHovered,
        isGroupHovered,
        isDirectHovered,
        finalIsHovered: isHovered,
      });
    }
    const hoverStyle = isHovered ? 'bg-[#DDE9FF]' : '';

    return `${baseStyle} ${levelStyle} ${hoverStyle} ${selectedStyle}`;
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发空白区域的点击事件
    console.log(
      'Node click handler triggered for:',
      id,
      'current selectedNodeForAI:',
      data.selectedNodeForAI,
    );
    // 直接设置状态，不依赖复杂的回调
    if (data.onDirectSelect) {
      data.onDirectSelect(id);
    }
  };

  const handleSave = useCallback(() => {
    if (editValue.trim()) {
      onEdit?.(id, editValue.trim());
    }
    setIsEditing(false);
  }, [editValue, onEdit, id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(label);
      setIsEditing(false);
    }
  };

  // 处理点击外部区域自动保存
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isEditing &&
        inputRef.current &&
        !inputRef.current.contains(event.target as HTMLElement)
      ) {
        handleSave();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isEditing, handleSave]);

  // 自动聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Hover 状态管理
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    // 触发上级hover回调
    if (onNodeHover) {
      if (data.tweetId !== undefined) {
        // 三级节点：传递tweetId
        console.log(
          'EditableMindmapNode hover tweet:',
          data.tweetId,
          'node data:',
          data,
        );
        onNodeHover(data.tweetId.toString());
      } else if (data.outlineIndex !== undefined) {
        // 二级节点：传递groupIndex
        console.log(
          'EditableMindmapNode hover group:',
          data.outlineIndex,
          'node data:',
          data,
        );
        onNodeHover(`group-${data.outlineIndex}`);
      } else {
        console.log(
          'EditableMindmapNode hover - no valid hover data, node id:',
          id,
          'data:',
          data,
        );
        // 如果没有特定的ID，使用节点ID作为fallback
        onNodeHover(id);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // 清除hover状态
    if (onNodeHover) {
      onNodeHover(null);
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleNodeClick}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#555',
          width: '8px',
          height: '8px',
          border: '2px solid #fff',
          left: '0',
          opacity: 0,
        }}
      />

      <div
        className={getNodeStyle()}
        style={{
          pointerEvents: 'auto', // 确保可点击
        }}
      >
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            size="sm"
            variant="flat"
            className="min-w-[100px] border-none outline-none"
            classNames={{
              input: 'text-center bg-white/20 text-current',
              inputWrapper: 'bg-white/20',
            }}
          />
        ) : (
          <div onDoubleClick={handleDoubleClick} title="双击编辑">
            {label}
          </div>
        )}
      </div>

      {/* 添加子节点按钮 - hover 时显示 */}
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            addChildNode(id);
          }}
          className="absolute right-[-20px] top-1/2 flex size-[20px] -translate-y-1/2 items-center justify-center rounded-full bg-[#7EABFF] text-white shadow-md transition-all duration-200 hover:opacity-80 hover:shadow-lg"
          title="添加子节点"
        >
          <PlusIcon className="size-3" />
        </button>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#000000',
          width: '8px',
          height: '8px',
          border: '2px solid #fff',
          right: '0',
          opacity: 0,
        }}
      />
    </div>
  );
};

export default EditableMindmapNode;
