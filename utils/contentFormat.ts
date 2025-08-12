import { IContentFormat } from '@/types/api';

/**
 * 判断内容格式是否为长文类型（longform 或 deep_research）
 * @param contentFormat 内容格式
 * @returns 是否为长文类型
 */
export const isLongformType = (contentFormat: IContentFormat): boolean => {
  return contentFormat === 'longform' || contentFormat === 'deep_research';
};

/**
 * 判断内容格式是否为推文串类型
 * @param contentFormat 内容格式
 * @returns 是否为推文串类型
 */
export const isThreadType = (contentFormat: IContentFormat): boolean => {
  return contentFormat === 'thread';
};

/**
 * 获取内容格式的显示名称
 * @param contentFormat 内容格式
 * @returns 显示名称
 */
export const getContentFormatDisplayName = (
  contentFormat: IContentFormat,
): string => {
  switch (contentFormat) {
    case 'longform':
      return 'Article';
    case 'thread':
      return 'Threads';
    case 'deep_research':
      return 'Deep Research';
    default:
      return 'Unknown';
  }
};

/**
 * 获取内容格式的图标
 * @param contentFormat 内容格式
 * @returns 图标字符
 */
export const getContentFormatIcon = (contentFormat: IContentFormat): string => {
  switch (contentFormat) {
    case 'longform':
      return '≣';
    case 'thread':
      return '≡';
    case 'deep_research':
      return '≡';
    default:
      return '?';
  }
};

/**
 * 验证内容格式是否有效
 * @param format 待验证的格式
 * @returns 是否为有效的内容格式
 */
export const validateContentFormat = (
  format: unknown,
): format is IContentFormat => {
  return (
    typeof format === 'string' &&
    ['longform', 'thread', 'deep_research'].includes(format)
  );
};

/**
 * 获取默认内容格式
 * @returns 默认内容格式
 */
export const getDefaultContentFormat = (): IContentFormat => 'longform';

/**
 * 标准化内容格式，无效格式返回默认值
 * @param format 内容格式
 * @returns 标准化后的内容格式
 */
export const normalizeContentFormat = (format?: string): IContentFormat => {
  if (validateContentFormat(format)) {
    return format;
  }
  console.warn(`Invalid content format: ${format}, fallback to default`);
  return getDefaultContentFormat();
};
