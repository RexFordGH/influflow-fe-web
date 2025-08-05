import { GENERATION_MODES } from '@/config/generation-modes';
import { IContentFormat, IMode } from '@/types/api';
import { GenerationModeConfig, GenerationRequest } from '@/types/generation';

// 生成模式管理器单例类
export class GenerationModeManager {
  private static instance: GenerationModeManager;
  private configs: Record<IMode, GenerationModeConfig>;

  private constructor() {
    this.configs = GENERATION_MODES;
  }

  // 获取单例实例
  public static getInstance(): GenerationModeManager {
    if (!GenerationModeManager.instance) {
      GenerationModeManager.instance = new GenerationModeManager();
    }
    return GenerationModeManager.instance;
  }

  // 获取模式配置
  public getModeConfig(mode: IMode): GenerationModeConfig {
    const config = this.configs[mode];
    if (!config) {
      throw new Error(`Invalid mode: ${mode}`);
    }
    return config;
  }

  // 验证模式是否有效
  public isValidMode(mode: string): mode is IMode {
    return Object.keys(this.configs).includes(mode);
  }

  // 获取所有可用模式
  public getAvailableModes(): IMode[] {
    return Object.keys(this.configs) as IMode[];
  }

  // 验证模式参数
  public validateModeParams(
    mode: IMode,
    params: { userInput?: string; sessionId?: string },
  ): { valid: boolean; error?: string } {
    const config = this.getModeConfig(mode);

    if (
      config.requiresUserInput &&
      (!params.userInput || params.userInput.trim() === '')
    ) {
      return {
        valid: false,
        error: `Mode '${mode}' requires user input`,
      };
    }

    if (config.requiresSessionId && !params.sessionId) {
      return {
        valid: false,
        error: `Mode '${mode}' requires session ID`,
      };
    }

    return { valid: true };
  }

  // 构建生成请求
  public buildGenerationRequest(
    mode: IMode,
    topic: string,
    contentFormat: IContentFormat,
    params: { userInput?: string; sessionId?: string },
  ): GenerationRequest {
    const validation = this.validateModeParams(mode, params);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const config = this.getModeConfig(mode);

    // 根据模式构建请求
    const request: GenerationRequest = {
      mode,
      user_input: params.userInput || topic,
      content_format: contentFormat,
    };

    // 仅在需要时添加session_id
    if (config.requiresSessionId && params.sessionId) {
      request.session_id = params.sessionId;
    }

    return request;
  }

  // 检查是否需要草案确认
  public requiresDraftConfirmation(mode: IMode): boolean {
    const config = this.getModeConfig(mode);
    return config.requiresDraftConfirmation;
  }

  // 获取模式超时时间
  public getTimeout(mode: IMode): number {
    const config = this.getModeConfig(mode);
    return config.timeout || 120000; // 默认120秒
  }

  // 获取模式显示名称
  public getDisplayName(mode: IMode): string {
    const config = this.getModeConfig(mode);
    return config.displayName;
  }

  // 获取模式描述
  public getDescription(mode: IMode): string {
    const config = this.getModeConfig(mode);
    return config.description;
  }

  // 重置实例（主要用于测试）
  public static resetInstance(): void {
    GenerationModeManager.instance = null as any;
  }
}
