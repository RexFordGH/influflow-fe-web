import { IContentFormat, IMode } from '@/types/api';
import { GenerationModeConfig, GenerationRequest } from '@/types/generation';
import { GenerationModeManager } from '../GenerationModeManager';

// 抽象基类：定义模式处理器的接口
export abstract class BaseModeHandler {
  protected config: GenerationModeConfig;

  constructor(protected mode: IMode) {
    this.config = GenerationModeManager.getInstance().getModeConfig(mode);
  }

  // 构建请求参数
  abstract buildRequest(
    topic: string,
    contentFormat: IContentFormat,
    params: any,
  ): GenerationRequest;

  // 验证参数
  abstract validateParams(params: any): boolean;

  // 获取配置
  getConfig(): GenerationModeConfig {
    return this.config;
  }

  // 获取模式
  getMode(): IMode {
    return this.mode;
  }

  // 检查是否需要草案确认
  requiresDraftConfirmation(): boolean {
    return this.config.requiresDraftConfirmation;
  }

  // 获取超时时间
  getTimeout(): number {
    return this.config.timeout || 120000;
  }
}
