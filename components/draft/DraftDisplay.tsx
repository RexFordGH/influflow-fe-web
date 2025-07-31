'use client';

import React, { memo } from 'react';
import { DraftData } from '@/types/draft';
import { Card, CardBody, Skeleton, Chip } from '@heroui/react';
import { 
  DocumentTextIcon, 
  LightBulbIcon,
  UsersIcon,
  LanguageIcon,
  AcademicCapIcon,
  ClockIcon,
  BookOpenIcon,
  LinkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface DraftDisplayProps {
  draft: DraftData | null;
  isLoading?: boolean;
  className?: string;
}

interface DraftSectionProps {
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
  isLoading?: boolean;
}

const DraftSection: React.FC<DraftSectionProps> = ({ icon, title, content, isLoading }) => (
  <div className="flex gap-3 mb-4">
    <div className="flex-shrink-0 w-5 h-5 mt-0.5 text-gray-500">
      {icon}
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-medium text-gray-700 mb-1">{title}</h4>
      {isLoading ? (
        <Skeleton className="w-full h-4 rounded" />
      ) : (
        <div className="text-sm text-gray-600">{content}</div>
      )}
    </div>
  </div>
);

export const DraftDisplay = memo<DraftDisplayProps>(({ draft, isLoading = false, className = '' }) => {
  if (!draft && !isLoading) {
    return null;
  }

  // 目的显示映射
  const purposeMap = {
    educate: '教育',
    inform: '信息传递',
    entertain: '娱乐',
    persuade: '说服',
    inspire: '激励',
  };

  // 深度显示映射
  const depthMap = {
    surface: '浅层',
    moderate: '中等',
    deep: '深入',
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardBody>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">内容草案概览</h3>
          <p className="text-sm text-gray-500">根据您的需求生成的内容大纲</p>
        </div>

        {/* 主题 */}
        <DraftSection
          icon={<DocumentTextIcon />}
          title="主题"
          content={draft?.topic || ''}
          isLoading={isLoading}
        />

        {/* 内容角度 */}
        <DraftSection
          icon={<LightBulbIcon />}
          title="内容角度"
          content={draft?.content_angle || ''}
          isLoading={isLoading}
        />

        {/* 关键要点 */}
        <DraftSection
          icon={<CheckCircleIcon />}
          title="关键要点"
          content={
            draft?.key_points ? (
              <ul className="list-disc list-inside space-y-1">
                {draft.key_points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            ) : null
          }
          isLoading={isLoading}
        />

        {/* 目标受众 */}
        <DraftSection
          icon={<UsersIcon />}
          title="目标受众"
          content={draft?.target_audience || ''}
          isLoading={isLoading}
        />

        {/* 输出语言 */}
        <DraftSection
          icon={<LanguageIcon />}
          title="输出语言"
          content={draft?.output_language || ''}
          isLoading={isLoading}
        />

        {/* 内容目的 */}
        <DraftSection
          icon={<AcademicCapIcon />}
          title="内容目的"
          content={
            draft?.purpose ? (
              <Chip size="sm" variant="flat" color="primary">
                {purposeMap[draft.purpose] || draft.purpose}
              </Chip>
            ) : null
          }
          isLoading={isLoading}
        />

        {/* 预估长度 */}
        <DraftSection
          icon={<ClockIcon />}
          title="预估长度"
          content={draft?.content_length || ''}
          isLoading={isLoading}
        />

        {/* 内容深度 */}
        <DraftSection
          icon={<BookOpenIcon />}
          title="内容深度"
          content={
            draft?.content_depth ? (
              <Chip size="sm" variant="flat" color="secondary">
                {depthMap[draft.content_depth] || draft.content_depth}
              </Chip>
            ) : null
          }
          isLoading={isLoading}
        />

        {/* 参考链接 */}
        {draft?.references && draft.references.length > 0 && (
          <DraftSection
            icon={<LinkIcon />}
            title="参考资料"
            content={
              <ul className="space-y-1">
                {draft.references.map((ref, index) => (
                  <li key={index}>
                    <a 
                      href={ref} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {ref}
                    </a>
                  </li>
                ))}
              </ul>
            }
            isLoading={isLoading}
          />
        )}

        {/* 特殊要求 */}
        {draft?.requirements && draft.requirements.length > 0 && (
          <DraftSection
            icon={<CheckCircleIcon />}
            title="特殊要求"
            content={
              <ul className="list-disc list-inside space-y-1">
                {draft.requirements.map((req, index) => (
                  <li key={index} className="text-sm">{req}</li>
                ))}
              </ul>
            }
            isLoading={isLoading}
          />
        )}

        {/* 更新动画效果 */}
        <style jsx>{`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
          }
          
          .draft-update {
            animation: pulse 0.5s ease-in-out;
          }
        `}</style>
      </CardBody>
    </Card>
  );
});

DraftDisplay.displayName = 'DraftDisplay';