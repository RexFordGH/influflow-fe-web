import { IContentFormat } from '@/types/api';
import { GenerationRequest } from '@/types/generation';
import { BaseModeHandler } from './BaseModeHandler';

export interface LiteModeParams {
  userInput: string;
}

// Lite模式处理器
export class LiteModeHandler extends BaseModeHandler {
  constructor() {
    super('lite');
  }

  buildRequest(
    topic: string,
    contentFormat: IContentFormat,
    params: LiteModeParams,
  ): GenerationRequest {
    if (!this.validateParams(params)) {
      throw new Error('Invalid parameters for lite mode');
    }

    return {
      mode: 'lite',
      user_input: params.userInput,
      content_format: contentFormat,
    };
  }

  validateParams(params: LiteModeParams): boolean {
    return !!params.userInput && params.userInput.trim().length > 0;
  }
}
