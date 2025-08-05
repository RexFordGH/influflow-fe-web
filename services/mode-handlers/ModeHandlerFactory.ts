import { IMode } from '@/types/api';
import { AnalysisModeHandler } from './AnalysisModeHandler';
import { BaseModeHandler } from './BaseModeHandler';
import { DraftModeHandler } from './DraftModeHandler';
import { LiteModeHandler } from './LiteModeHandler';

// 模式处理器工厂类
export class ModeHandlerFactory {
  private static handlers: Map<IMode, BaseModeHandler> = new Map();

  // 获取处理器实例
  static getHandler(mode: IMode): BaseModeHandler {
    if (!this.handlers.has(mode)) {
      switch (mode) {
        case 'draft':
          this.handlers.set(mode, new DraftModeHandler());
          break;
        case 'lite':
          this.handlers.set(mode, new LiteModeHandler());
          break;
        case 'analysis':
          this.handlers.set(mode, new AnalysisModeHandler());
          break;
        default:
          throw new Error(`Unsupported mode: ${mode}`);
      }
    }

    return this.handlers.get(mode)!;
  }

  // 清除缓存的处理器实例（主要用于测试）
  static clearHandlers(): void {
    this.handlers.clear();
  }

  // 检查是否支持该模式
  static isSupported(mode: string): boolean {
    return ['draft', 'lite', 'analysis'].includes(mode);
  }
}
