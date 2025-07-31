import { DraftConfirmationState, DraftAction } from '@/types/draft';

export const initialState: DraftConfirmationState = {
  draft: null,
  threadId: null,
  messages: [],
  isLoading: false,
  isThinking: false,
  isConfirmed: false,
  requiresReview: true,
  error: null,
};

export const draftReducer = (
  state: DraftConfirmationState,
  action: DraftAction
): DraftConfirmationState => {
  switch (action.type) {
    case 'SET_DRAFT':
      return {
        ...state,
        draft: action.payload.draft,
        threadId: action.payload.thread_id,
        requiresReview: action.payload.requires_review,
        error: null,
      };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_THINKING':
      return {
        ...state,
        isThinking: action.payload,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isThinking: false,
      };
    
    case 'SET_CONFIRMED':
      return {
        ...state,
        isConfirmed: action.payload,
      };
    
    case 'CLEAR_STATE':
      return initialState;
    
    default:
      return state;
  }
};