'use client';

import {
  AcademicCapIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  LanguageIcon,
  LightBulbIcon,
  LinkIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { Card, CardBody, Chip, Skeleton } from '@heroui/react';
import { motion } from 'framer-motion';
import React, { memo } from 'react';

import { DraftData } from '@/types/draft';

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

const DraftSection: React.FC<DraftSectionProps> = ({
  icon,
  title,
  content,
  isLoading,
}) => (
  <div className="mb-4 flex gap-3">
    <div className="mt-0.5 size-5 shrink-0 text-gray-500">{icon}</div>
    <div className="flex-1">
      <h4 className="mb-1 text-sm font-medium text-gray-700">{title}</h4>
      {isLoading ? (
        <Skeleton className="h-4 w-full rounded" />
      ) : (
        <div className="text-sm text-gray-600">{content}</div>
      )}
    </div>
  </div>
);

export const DraftDisplay = memo<DraftDisplayProps>(
  ({ draft, isLoading = false, className = '' }) => {
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

    // Framer Motion 动画配置
    const cardAnimation = {
      initial: { scale: 1 },
      animate: draft ? { scale: [1, 1.02, 1] } : { scale: 1 },
      transition: { duration: 0.5, ease: 'easeInOut' },
    };

    return (
      <motion.div
        initial={cardAnimation.initial}
        animate={cardAnimation.animate}
        transition={cardAnimation.transition}
        className={`w-full ${className}`}
      >
        <Card className="w-full">
          <CardBody>
          <div className="mb-4">
            <h3 className="mb-1 text-lg font-semibold text-gray-800">
              内容草案概览
            </h3>
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
                <ul className="list-inside list-disc space-y-1">
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
                        className="text-sm text-blue-600 hover:underline"
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
                <ul className="list-inside list-disc space-y-1">
                  {draft.requirements.map((req, index) => (
                    <li key={index} className="text-sm">
                      {req}
                    </li>
                  ))}
                </ul>
              }
              isLoading={isLoading}
            />
          )}

          </CardBody>
        </Card>
      </motion.div>
    );
  },
);

DraftDisplay.displayName = 'DraftDisplay';
