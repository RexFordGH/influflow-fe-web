// 生成步骤配置
export const GENERATION_STEPS = [
  'Analyzing topic content and related background',
  'Building mind map structure framework',
  'Generating structured article content',
  'Establishing relationships between content',
  'Refining details and optimizing layout',
] as const;

// 步骤时间配置
export const STEP_TIMINGS = [
  { step: 1, delay: 2000 },
  { step: 2, delay: 4000 },
  { step: 3, delay: 6500 },
] as const;

// 模态框类型
export const MODAL_TYPES = {
  IMAGE_EDIT: 'imageEdit',
  DELETE: 'delete',
  AI_EDIT: 'aiEdit',
} as const;

// 节点类型
export const NODE_TYPES = {
  TOPIC: 'topic',
  OUTLINE_POINT: 'outline_point',
  TWEET: 'tweet',
} as const;

// 节点样式配置
export const NODE_STYLES = {
  [NODE_TYPES.TOPIC]: {
    background: '#e0f2ff',
    border: '2px solid #0066cc',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  [NODE_TYPES.OUTLINE_POINT]: {
    background: '#f0f9ff',
    border: '1px solid #0284c7',
    fontSize: '14px',
  },
  [NODE_TYPES.TWEET]: {
    background: '#fefce8',
    border: '1px solid #facc15',
    fontSize: '12px',
  },
} as const;

// API 端点
export const API_ENDPOINTS = {
  GENERATE_THREAD: '/api/generate-thread',
  MODIFY_OUTLINE: '/api/modify-outline',
  MODIFY_TWEET: '/api/modify-tweet',
  GENERATE_IMAGE: '/api/generate-image',
  POST_TO_TWITTER: '/api/twitter/post',
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  GENERATION_FAILED: 'Failed to generate content. Please try again.',
  SAVE_FAILED: 'Failed to save changes. Please try again.',
  IMAGE_UPLOAD_FAILED: 'Failed to upload image. Please try again.',
  TWITTER_POST_FAILED:
    'Failed to post to Twitter. Please check your connection.',
  AI_EDIT_FAILED: 'Failed to apply AI edits. Please try again.',
  DELETE_IMAGE_FAILED: '无法删除图片',
  MISSING_DATA: '缺少必要的数据，请稍后重试。',
} as const;

// 内容格式
export const CONTENT_FORMATS = {
  THREAD: 'thread',
  LONGFORM: 'longform',
} as const;

// 时间配置
export const TIMING_CONFIG = {
  GENERATION_STEP_FAST: 500, // 快速推进步骤的延迟
  SCROLL_CLEAR_DELAY: 200, // 清除滚动状态的延迟
  FINAL_STEP_DELAY: 4000, // 最后一个步骤的延迟
  WAITING_STEP_DELAY: 8000, // 等待步骤的延迟
  TOAST_TIMEOUT: 3000, // Toast 提示的显示时间
  TWITTER_POST_TIMEOUT: 5000, // Twitter 发布提示的显示时间
} as const;

// 图片相关配置
export const IMAGE_CONFIG = {
  MAX_PROMPT_LENGTH: 300, // AI 编辑提示的最大长度
  DEFAULT_IMAGE_ALT: 'Image', // 默认图片替代文本
  TWEET_DELAY_SECONDS: 1, // Twitter 推文间隔时间（秒）
} as const;

// UI 配置
export const UI_CONFIG = {
  CONTENT_WIDTH: 628, // 内容区域宽度
  AVATAR_SIZE: 40, // 头像尺寸
  CONTENT_PADDING: 24, // 内容内边距
  BOTTOM_PADDING: 60, // 底部内边距
} as const;
