import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Animation state management
const AnimationContext = createContext();

const initialState = {
  animations: [],
  isLoading: false,
  error: null,
  currentAnimation: null
};

function animationReducer(state, action) {
  try {
    switch (action.type) {
      case 'ADD_ANIMATION':
        console.log('Adding animation to state:', action.payload);
        return {
          ...state,
          animations: [...state.animations, action.payload],
          currentAnimation: action.payload,
          error: null
        };
      case 'SET_LOADING':
        return {
          ...state,
          isLoading: action.payload
        };
      case 'SET_ERROR':
        console.error('Animation error:', action.payload);
        return {
          ...state,
          error: action.payload,
          isLoading: false
        };
      case 'CLEAR_ANIMATIONS':
        return {
          ...state,
          animations: [],
          currentAnimation: null
        };
      case 'SET_CURRENT':
        return {
          ...state,
          currentAnimation: action.payload
        };
      default:
        return state;
    }
  } catch (error) {
    console.error('Animation reducer error:', error);
    return {
      ...state,
      error: error.message
    };
  }
}

export const AnimationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(animationReducer, initialState);

  const addAnimation = useCallback((animation) => {
    try {
      dispatch({ type: 'ADD_ANIMATION', payload: animation });
    } catch (error) {
      console.error('Add animation error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const setLoading = useCallback((loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const clearAnimations = useCallback(() => {
    dispatch({ type: 'CLEAR_ANIMATIONS' });
  }, []);

  const setCurrentAnimation = useCallback((animation) => {
    dispatch({ type: 'SET_CURRENT', payload: animation });
  }, []);

  const value = {
    ...state,
    addAnimation,
    setLoading,
    setError,
    clearAnimations,
    setCurrentAnimation
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};
