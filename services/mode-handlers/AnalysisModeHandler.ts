import { IContentFormat } from '@/types/api';
import { GenerationRequest } from '@/types/generation';
import { BaseModeHandler } from './BaseModeHandler';

export interface AnalysisModeParams {
  userInput: string;
}

// Analysis模式处理器
export class AnalysisModeHandler extends BaseModeHandler {
  constructor() {
    super('analysis');
  }

  buildRequest(
    topic: string,
    contentFormat: IContentFormat,
    params: AnalysisModeParams,
  ): GenerationRequest {
    if (!this.validateParams(params)) {
      throw new Error('Invalid parameters for analysis mode');
    }

    return {
      mode: 'analysis',
      user_input: params.userInput,
      content_format: contentFormat,
    };
  }

  validateParams(params: AnalysisModeParams): boolean {
    return !!params.userInput && params.userInput.trim().length > 0;
  }
}
