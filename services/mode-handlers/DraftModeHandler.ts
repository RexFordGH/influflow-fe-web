import { IContentFormat } from '@/types/api';
import { GenerationRequest } from '@/types/generation';
import { BaseModeHandler } from './BaseModeHandler';

export interface DraftModeParams {
  sessionId: string;
  userInput?: string;
}

// Draft模式处理器
export class DraftModeHandler extends BaseModeHandler {
  constructor() {
    super('draft');
  }

  buildRequest(
    topic: string,
    contentFormat: IContentFormat,
    params: DraftModeParams,
  ): GenerationRequest {
    if (!this.validateParams(params)) {
      throw new Error('Invalid parameters for draft mode');
    }
    
    if (!contentFormat) {
      throw new Error('Content format is required for draft mode');
    }

    return {
      mode: 'draft',
      user_input: params.userInput || '', // draft模式user_input可以为空
      content_format: contentFormat,
      session_id: params.sessionId,
    };
  }

  validateParams(params: DraftModeParams): boolean {
    return !!params.sessionId && params.sessionId.trim().length > 0;
  }
}
