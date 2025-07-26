// Markdown 渲染器样式配置文件
// 统一管理所有样式类，提高可维护性

export const markdownStyles = {
  // 容器样式
  container: {
    main: 'h-full overflow-y-auto bg-white font-inter',
    content: 'p-[24px]',
    sections: 'w-[580px] space-y-[12px] font-inter',
  },

  // 基础布局样式
  base: {
    // 可交互的内容模块
    interactive:
      'transition-all duration-300 p-[12px] rounded-lg relative group cursor-pointer',
    // 静态内容模块（标题、时间、图片等）
    static: 'rounded-lg relative',
  },

  // 状态样式
  states: {
    highlighted: 'bg-blue-50 transform scale-[1.02]',
    hover: 'hover:bg-gray-50 hover:shadow-md',
    loading: 'opacity-60 cursor-wait',
  },

  // 标题样式
  headings: {
    h1: 'text-2xl font-bold text-gray-900',
    h2: 'text-xl font-bold text-gray-800',
    h3: 'text-lg font-semibold text-gray-800',
    h4: 'text-base font-semibold text-gray-700',
    h5: 'text-sm font-semibold text-gray-700',
    h6: 'text-sm font-medium text-gray-600',
  },

  // 段落和文本样式
  text: {
    paragraph: 'text-[14px] leading-relaxed text-[#8C8C8C]',
    bold: 'font-semibold text-gray-900',
    italic: 'italic text-gray-600',
    hashtag: 'text-blue-600 font-medium',
    timeText: 'text-gray-500 text-sm',
  },

  // 列表样式
  lists: {
    container: 'space-y-2',
    orderedContainer: 'ml-4 space-y-2',
    item: 'flex items-start text-sm leading-relaxed text-gray-700',
    orderedItem: 'list-decimal text-sm leading-relaxed text-gray-700',
    bullet: 'mr-3 mt-2 inline-block size-1.5 shrink-0 rounded-full bg-blue-500',
    itemContent: 'ml-2',
  },

  // Tweet 样式
  tweet: {
    container: 'border border-gray-100',
    titleContainer: 'border-b border-gray-200 pb-3',
    content: 'text-[15px] font-[500] leading-relaxed text-gray-700',
  },

  // 分组样式
  group: {
    container: 'mb-6',
    content: 'text-sm leading-relaxed text-gray-700',
  },

  // 图片样式
  image: {
    container: 'mb-6',
    image: 'h-48 w-full rounded-lg object-cover shadow-md',
    overlay:
      'absolute inset-x-0 bottom-0 rounded-b-lg bg-gradient-to-t from-black/60 to-transparent p-4',
    caption: 'text-sm font-medium text-white drop-shadow-lg',
  },

  // 加载状态样式
  loading: {
    indicator: 'absolute left-2 top-2',
    spinner:
      'size-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent',
    zIndex: 'absolute left-2 top-2 z-10',
  },

  // 来源按钮样式
  source: {
    button:
      'opacity-0 transition-opacity hover:bg-blue-50 group-hover:opacity-100',
    icon: 'size-5 text-blue-600',
  },

  // 格式化处理的样式
  formatting: {
    bold: '<strong class="font-semibold text-gray-900">$1</strong>',
    italic: '<em class="italic text-gray-600">$1</em>',
    hashtag: '<span class="text-blue-600 font-medium">#$1</span>',
    emoji: '<span class="text-lg mr-1">$1</span>',
  },
} as const;

// 样式工具函数
export const getHeadingClass = (level: number): string => {
  const headingMap = {
    1: markdownStyles.headings.h1,
    2: markdownStyles.headings.h2,
    3: markdownStyles.headings.h3,
    4: markdownStyles.headings.h4,
    5: markdownStyles.headings.h5,
    6: markdownStyles.headings.h6,
  } as const;

  return (
    headingMap[level as keyof typeof headingMap] || markdownStyles.headings.h6
  );
};

// 判断是否需要交互效果的函数
export const shouldEnableInteraction = (section: {
  type: string;
  content?: string;
}): boolean => {
  return (
    section.type === 'tweet' ||
    section.type === 'group' ||
    (section.type === 'paragraph' &&
      !section.content?.includes('Edited on') &&
      !section.content?.includes('!['))
  );
};

// 获取基础样式类的函数
export const getBaseClasses = (shouldInteract: boolean): string => {
  return shouldInteract
    ? markdownStyles.base.interactive
    : markdownStyles.base.static;
};

// 获取高亮样式类的函数
export const getHighlightClasses = (
  isHighlighted: boolean,
  shouldInteract: boolean,
): string => {
  if (isHighlighted) {
    return markdownStyles.states.highlighted;
  }
  return shouldInteract ? markdownStyles.states.hover : '';
};
