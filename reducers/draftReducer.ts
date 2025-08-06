import { IDraftAction, IDraftConfirmationState } from '@/types/draft';

export const initialState: IDraftConfirmationState = {
  draft: null,
  session_id: null,
  messages: [],
  isLoading: false,
  isThinking: false,
  isConfirmed: false,
  requires_review: true,
  error: null,
};

export const draftReducer = (
  state: IDraftConfirmationState,
  action: IDraftAction,
): IDraftConfirmationState => {
  switch (action.type) {
    case 'SET_DRAFT':
      return {
        ...state,
        draft: action.payload.draft,
        session_id: action.payload.session_id,
        requires_review: action.payload.requires_review,
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
