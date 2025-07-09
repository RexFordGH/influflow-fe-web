'use client';

import { Input } from '@heroui/react';
import { PlusIcon } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [pendingValue, setPendingValue] = useState<string | null>(null); // 保存编辑后的临时文案
  const inputRef = useRef<HTMLInputElement>(null);

  // 根据层级确定样式 - 使用 useMemo 优化
  const getNodeStyle = useMemo(() => {
    // 优化文本换行和显示 - 确保长文本能正确换行
    const baseStyle =
      'min-w-[80px] min-h-[30px] px-[12px] py-[8px] rounded-[8px] transition-all duration-200 cursor-pointer relative group border-none outline-none text-[12px] font-[500] leading-[1.4]';

    // 根据层级决定对齐方式 - 移除flex相关类，让文本自然换行
    const alignmentStyle = level === 1 ? 'text-center' : 'text-left';

    const levelColors = {
      1: '!bg-[#000000] !text-white !hover:bg-[rgba(0,0,0,0.6)] max-w-[250px] min-h-[40px]',
      2: 'bg-[#E3E3E3] text-black hover:bg-[#DDE9FF] max-w-[200px] min-h-[35px]',
      3: 'bg-[#E3E3E3] text-black hover:bg-[#DDE9FF] max-w-[180px] min-h-[30px]',
      4: 'bg-[#E3E3E3] text-black hover:bg-[#DDE9FF] max-w-[180px] min-h-[30px]',
      5: 'bg-[#E3E3E3] text-black hover:bg-[#DDE9FF] max-w-[180px] min-h-[30px]',
      6: 'bg-[#E3E3E3] text-black hover:bg-[#DDE9FF] max-w-[180px] min-h-[30px]',
    };

    const levelStyle =
      levelColors[level as keyof typeof levelColors] || levelColors[6];

    // 使用 React Flow 原生的选中状态 - 优先级高于 hover
    const selectedStyle = selected
      ? 'ring-1 ring-blue-400 ring-offset-1 !bg-[#DDE9FF]'
      : '';

    // Debug: 输出选中状态 - 临时注释
    // if (selected) {
    //   console.log(`✅ Node ${id} is SELECTED via React Flow:`, {
    //     selected,
    //     selectedStyle,
    //   });
    // }

    // 检查是否应该高亮（基于hoveredTweetId） - 修复数据类型匹配
    const isTweetHovered =
      hoveredTweetId &&
      data.tweetId !== undefined &&
      (String(data.tweetId) === String(hoveredTweetId) ||
        Number(data.tweetId) === Number(hoveredTweetId));

    const isGroupHovered =
      hoveredTweetId &&
      String(hoveredTweetId).startsWith('group-') &&
      data.outlineIndex !== undefined &&
      (String(data.outlineIndex) ===
        String(hoveredTweetId).replace('group-', '') ||
        Number(data.outlineIndex) ===
          Number(String(hoveredTweetId).replace('group-', '')));

    const isDirectHovered = String(hoveredTweetId) === String(id); // 直接ID匹配
    const isHovered = isTweetHovered || isGroupHovered || isDirectHovered;

    // Debug信息 - 临时注释掉减少输出
    // if (hoveredTweetId && isHovered) {
    //   console.log(`✅ Node ${id} HOVER MATCH:`, {
    //     hoveredTweetId,
    //     matchType: isTweetHovered ? 'tweet' : isGroupHovered ? 'group' : 'direct',
    //     nodeTweetId: data.tweetId,
    //     nodeOutlineIndex: data.outlineIndex,
    //   });
    // }
    // 应用 hover 样式（未选中时）或强化选中样式
    const hoverStyle = isHovered && !selected ? '!bg-[#DDE9FF]' : '';

    // 添加调试样式检查
    const finalStyle = `${baseStyle} ${alignmentStyle} ${levelStyle} ${hoverStyle} ${selectedStyle}`;
    // if (isHovered) {
    //   console.log(`🎨 Node ${id} applying hover style:`, {
    //     isHovered,
    //     selected,
    //     hoverStyle,
    //     finalStyle,
    //   });
    // }

    return finalStyle;
  }, [level, selected, hoveredTweetId, data.tweetId, data.outlineIndex, id]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleNodeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // 防止触发空白区域的点击事件
      console.log(
        'Node click handler triggered for:',
        id,
        'selected:',
        selected,
      );

      // 手动触发选中状态（因为 React Flow 自动选中可能被阻止）
      if (data.onNodeClick) {
        data.onNodeClick(id);
      }
    },
    [id, selected, data.onNodeClick],
  );

  const handleSave = useCallback(() => {
    if (editValue.trim()) {
      // 设置 pending 状态，显示用户刚编辑的内容
      setPendingValue(editValue.trim());
      onEdit?.(id, editValue.trim());
    }
    setIsEditing(false);
  }, [editValue, onEdit, id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        // 取消编辑，恢复原状态
        setEditValue(label);
        setPendingValue(null); // 清除 pending 状态
        setIsEditing(false);
      }
    },
    [handleSave, label],
  );

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

  // 当 label 更新时清除 pending 状态（本地编辑完成后）
  useEffect(() => {
    if (pendingValue && label === pendingValue) {
      // 当 label 更新为 pending 值时，清除 pending 状态
      setPendingValue(null);
    }
  }, [label, pendingValue]);

  // 同步 editValue 和 label
  useEffect(() => {
    if (!isEditing && !pendingValue) {
      setEditValue(label);
    }
  }, [label, isEditing, pendingValue]);

  // Hover 状态管理
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
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
  }, [onNodeHover, data.tweetId, data.outlineIndex, id, data]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    // 清除hover状态
    if (onNodeHover) {
      onNodeHover(null);
    }
  }, [onNodeHover]);

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
        className={`${getNodeStyle} ${isEditing ? '!w-auto !min-w-fit !max-w-none' : ''}`}
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
            className="max-w-none border-none outline-none"
            style={{ width: `${Math.max(editValue.length * 8, 100)}px` }}
            classNames={{
              input: 'text-center bg-white/20 text-current whitespace-pre-wrap',
              inputWrapper: 'bg-white/20 max-w-none',
            }}
          />
        ) : (
          <div
            onClick={handleNodeClick}
            onDoubleClick={handleDoubleClick}
            title="双击编辑"
            className="size-full whitespace-normal break-words"
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
              display: 'block',
            }}
          >
            {pendingValue || label}
          </div>
        )}
      </div>

      {/* 添加子节点按钮 - hover 时显示，且当前节点深度小于4层 */}
      {isHovered && level < 3 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            addChildNode(id);
          }}
          className="absolute right-[-20px] top-1/2 flex size-[20px] -translate-y-1/2 items-center justify-center rounded-full bg-[#7EABFF] text-white shadow-md transition-all duration-200 hover:opacity-80 hover:shadow-lg"
          title="add child node"
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
