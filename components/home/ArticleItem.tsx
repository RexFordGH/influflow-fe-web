'use client';

import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Image } from '@heroui/react';

import { Article } from '@/types/content';

// 递归文章项组件
export const ArticleItem = ({
  article,
  categoryId,
  level = 0,
  onToggleExpanded,
  onOpenEditor,
  onAddChild,
  editingArticleId,
  tempTitle,
  onStartEditTitle,
  onSaveTitle,
  onCancelEdit,
  onTempTitleChange,
}: {
  article: Article;
  categoryId: string;
  level?: number;
  onToggleExpanded: (categoryId: string, articleId: string) => void;
  onOpenEditor: (categoryId: string, articleId: string) => void;
  onAddChild: (categoryId: string, parentId: string) => void;
  editingArticleId: string | null;
  tempTitle: string;
  onStartEditTitle: (categoryId: string, articleId: string) => void;
  onSaveTitle: (categoryId: string, articleId: string) => void;
  onCancelEdit: () => void;
  onTempTitleChange: (title: string) => void;
}) => {
  const hasChildren = article.children.length > 0;
  const indentClass = level > 0 ? `ml-${level * 4}` : '';

  return (
    <div className={`${indentClass}`}>
      <div className="group flex min-h-[37px] items-center justify-between rounded-[8px] px-2 py-1 hover:bg-[#E8E8E8]">
        <div className="flex flex-1 items-center space-x-2">
          {hasChildren && (
            <button
              onClick={() => onToggleExpanded(categoryId, article.id)}
              className="rounded p-1 hover:bg-gray-200"
            >
              <Image
                src={'/icons/arrowLeft.svg'}
                alt="arrow-right"
                width={24}
                height={24}
                className={`transition-transform ${article.expanded ? 'rotate-90' : ''}`}
              />
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          <DocumentTextIcon className="size-4 text-gray-500" />
          {editingArticleId === article.id ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => onTempTitleChange(e.target.value)}
              onBlur={() => onSaveTitle(categoryId, article.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveTitle(categoryId, article.id);
                if (e.key === 'Escape') onCancelEdit();
              }}
              className="flex-1 rounded border-none bg-transparent px-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <button
              onClick={() => onOpenEditor(categoryId, article.id)}
              onDoubleClick={() => onStartEditTitle(categoryId, article.id)}
              className={`flex-1 truncate text-left text-sm text-gray-700 hover:text-gray-900 ${
                categoryId === 'welcome' ? 'cursor-default' : ''
              }`}
              title={article.title}
            >
              {article.title}
            </button>
          )}
        </div>
        {categoryId !== 'welcome' && (
          <button
            onClick={() => onAddChild(categoryId, article.id)}
            className="rounded p-1 opacity-0 transition-opacity hover:bg-gray-200 group-hover:opacity-100"
          >
            <PlusIcon className="size-3 text-gray-600" />
          </button>
        )}
      </div>
      {hasChildren && article.expanded && (
        <div className="ml-4">
          {article.children.map((child) => (
            <ArticleItem
              key={child.id}
              article={child}
              categoryId={categoryId}
              level={level + 1}
              onToggleExpanded={onToggleExpanded}
              onOpenEditor={onOpenEditor}
              onAddChild={onAddChild}
              editingArticleId={editingArticleId}
              tempTitle={tempTitle}
              onStartEditTitle={onStartEditTitle}
              onSaveTitle={onSaveTitle}
              onCancelEdit={onCancelEdit}
              onTempTitleChange={onTempTitleChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
