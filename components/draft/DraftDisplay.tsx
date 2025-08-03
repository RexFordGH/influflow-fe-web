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
      educate: 'Educate',
      inform: 'Inform',
      entertain: 'Entertain',
      persuade: 'Persuade',
      inspire: 'Inspire',
    };

    // 深度显示映射
    const depthMap = {
      surface: 'Surface',
      moderate: 'Moderate',
      deep: 'Deep',
    };

    // Framer Motion 动画配置
    const cardAnimation = {
      initial: { scale: 1 },
      animate: draft ? { scale: [1, 1.02, 1] } : { scale: 1 },
      transition: { duration: 0.5, ease: 'easeInOut' as const },
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
                Content Draft Overview
              </h3>
              <p className="text-sm text-gray-500">
                Content outline generated based on your requirements
              </p>
            </div>

            {/* 主题 */}
            <DraftSection
              icon={<DocumentTextIcon />}
              title="Topic"
              content={draft?.topic || ''}
              isLoading={isLoading}
            />

            {/* 内容角度 */}
            <DraftSection
              icon={<LightBulbIcon />}
              title="Content Angle"
              content={draft?.content_angle || ''}
              isLoading={isLoading}
            />

            {/* 关键要点 */}
            <DraftSection
              icon={<CheckCircleIcon />}
              title="Key Points"
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
              title="Target Audience"
              content={draft?.target_audience || ''}
              isLoading={isLoading}
            />

            {/* 输出语言 */}
            <DraftSection
              icon={<LanguageIcon />}
              title="Output Language"
              content={draft?.output_language || ''}
              isLoading={isLoading}
            />

            {/* 内容目的 */}
            <DraftSection
              icon={<AcademicCapIcon />}
              title="Content Purpose"
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
              title="Estimated Length"
              content={draft?.content_length || ''}
              isLoading={isLoading}
            />

            {/* 内容深度 */}
            <DraftSection
              icon={<BookOpenIcon />}
              title="Content Depth"
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
                title="References"
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
                title="Special Requirements"
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
