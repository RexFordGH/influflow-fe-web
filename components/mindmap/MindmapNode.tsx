/**
 * 思维导图自定义节点组件
 * 基于 React Flow 的自定义节点，集成 HeroUI 样式
 */

'use client';

import { useContentStore } from '@/stores/contentStore';
import { cn, Input } from '@heroui/react';
import { memo, useEffect, useRef, useState } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';

// 节点数据类型
export interface MindmapNodeData {
  label: string;
  level: number;
  content?: string;
  originalNode?: any;
}

/**
 * 思维导图节点组件
 *
 * 功能特性：
 * 1. 根据标题层级显示不同样式
 * 2. 支持点击和悬浮交互
 * 3. 集成 HeroUI 设计系统
 * 4. 响应式布局适配
 */
const MindmapNode = memo<NodeProps<MindmapNodeData>>(
  ({ data, id, selected }) => {
    const { setSelectedNode, setHoveredNode, updateNodeContent } =
      useContentStore();

    // 编辑状态
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(data.label);
    const [isHovered, setIsHovered] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    /**
     * 处理节点点击事件
     * 选中节点并触发与 Markdown 编辑器的联动
     */
    const handleClick = () => {
      setSelectedNode(id);
    };

    /**
     * 处理双击事件，进入编辑模式
     */
    const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(data.label);
    };

    /**
     * 处理编辑完成
     */
    const handleEditComplete = () => {
      if (editValue.trim() && editValue !== data.label) {
        updateNodeContent(id, editValue.trim());
      }
      setIsEditing(false);
    };

    /**
     * 处理键盘事件
     */
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleEditComplete();
      } else if (e.key === 'Escape') {
        setEditValue(data.label);
        setIsEditing(false);
      }
    };

    /**
     * 处理鼠标悬浮事件
     * 用于实现悬浮时的预览联动
     */
    const handleMouseEnter = () => {
      setHoveredNode(id);
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setHoveredNode(null);
      setIsHovered(false);
    };

    // 进入编辑模式时自动聚焦输入框
    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    // 当节点数据变化时更新编辑值
    useEffect(() => {
      setEditValue(data.label);
    }, [data.label]);

    /**
     * 根据标题层级获取节点样式配置
     */
    const getNodeStyle = (level: number) => {
      const styles = {
        1: {
          backgroundColor: '#FF6B6B',
          textColor: 'white',
          className: 'font-bold text-lg',
        },
        2: {
          backgroundColor: '#4ECDC4',
          textColor: 'white',
          className: 'font-semibold text-base',
        },
        3: {
          backgroundColor: '#45B7D1',
          textColor: 'white',
          className: 'font-medium text-sm',
        },
        4: {
          backgroundColor: '#96CEB4',
          textColor: 'white',
          className: 'font-normal text-sm',
        },
        5: {
          backgroundColor: '#FFEAA7',
          textColor: '#2d3748',
          className: 'font-normal text-xs',
        },
        6: {
          backgroundColor: '#DDA0DD',
          textColor: 'white',
          className: 'font-light text-xs',
        },
      };

      return styles[level as keyof typeof styles] || styles[6];
    };

    const nodeStyle = getNodeStyle(data.level);

    return (
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        {/* 输入连接点 */}
        <Handle
          type="target"
          position={Position.Left}
          style={{
            background: '#555',
            width: '6px',
            height: '6px',
            border: '1px solid #fff',
            opacity: isHovered || selected ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
            transform: 'translateX(8px)',
          }}
        />

        {/* 节点主体 - 胶囊形状 */}
        <div
          className={cn(
            'mindmap-node cursor-pointer transition-all duration-200',
            'px-4 py-2 rounded-[12px]',
            'min-w-[120px] max-w-[250px] min-h-[40px]',
            'flex items-center justify-center',
            selected ? 'ring-2 ring-blue-500 ring-offset-2' : '',
            'hover:scale-105',
          )}
          style={{
            backgroundColor: nodeStyle.backgroundColor,
            color: nodeStyle.textColor,
          }}
        >
          {/* 节点标题 */}
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleEditComplete}
              size="sm"
              variant="flat"
              className="text-center"
              classNames={{
                input: `${nodeStyle.className} text-center`,
                inputWrapper: 'bg-white/20 border-white/30',
              }}
              style={{ color: nodeStyle.textColor }}
            />
          ) : (
            <div
              className={`${nodeStyle.className} text-center whitespace-nowrap`}
              title="双击编辑"
            >
              {data.label}
            </div>
          )}
        </div>

        {/* 输出连接点 */}
        <Handle
          type="source"
          position={Position.Right}
          className="opacity-0"
          style={{
            background: '#555',
            width: '6px',
            height: '6px',
            border: '1px solid #fff',
            transition: 'opacity 0.2s ease-in-out',
            transform: 'translateX(-8px)',
          }}
        />
      </div>
    );
  },
);

MindmapNode.displayName = 'MindmapNode';

export default MindmapNode;
