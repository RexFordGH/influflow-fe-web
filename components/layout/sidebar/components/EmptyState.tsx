// Empty state component - Friendly empty data prompts

import { DocumentTextIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No content yet',
  description = 'There is no content yet, start creating your first one',
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12">
      {/* Icon */}
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gray-100">
        <DocumentTextIcon className="size-8 text-gray-400" />
      </div>

      {/* Title */}
      <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>

      {/* Description */}
      <p className="mb-6 max-w-sm text-center text-sm text-gray-500">
        {description}
      </p>

      {/* Action button */}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

// End of list component
export const EndOfList: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="text-center">
        <div className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-gray-100">
          <div className="size-2 rounded-full bg-gray-400"></div>
        </div>
        <p className="text-sm text-gray-500">No more content</p>
      </div>
    </div>
  );
};
