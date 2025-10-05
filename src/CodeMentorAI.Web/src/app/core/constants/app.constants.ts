/**
 * Application-wide constants
 * Centralized configuration values to avoid magic numbers
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000',
  ENDPOINTS: {
    MODELS: '/api/models',
    CODE_ANALYSIS: '/api/code-analysis',
    CHAT: '/api/chat'
  },
  TIMEOUT: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_SIZE: 50, // Maximum cache entries
  MODELS_KEY: 'ollama_models',
  ANALYSIS_KEY_PREFIX: 'analysis_'
} as const;

// SignalR Configuration
export const SIGNALR_CONFIG = {
  HUB_URL: '/modelhub',
  RECONNECT_DELAY: 5000, // 5 seconds
  MAX_RECONNECT_ATTEMPTS: 5,
  EVENTS: {
    MODEL_SWITCHED: 'ModelSwitched',
    MODEL_PULL_PROGRESS: 'ModelPullProgress',
    MODEL_PULL_COMPLETED: 'ModelPullCompleted',
    MODEL_REMOVED: 'ModelRemoved',
    MODEL_ADDED: 'ModelAdded',
    MODEL_DELETED: 'ModelDeleted',
    MODEL_PERFORMANCE_UPDATE: 'ModelPerformanceUpdate',
    MODEL_STATUS_CHANGED: 'ModelStatusChanged'
  }
} as const;

// UI Configuration
export const UI_CONFIG = {
  DEBOUNCE_TIME: 300, // milliseconds
  ANIMATION_DURATION: 200, // milliseconds
  TOAST_DURATION: 3000, // 3 seconds
  MAX_MESSAGE_LENGTH: 5000,
  MAX_CODE_LENGTH: 50000,
  SCROLL_THRESHOLD: 100 // pixels
} as const;

// Model Configuration
export const MODEL_CONFIG = {
  DEFAULT_MODEL: 'llama3.2:latest',
  SUPPORTED_MODELS: [
    'llama3.2:latest',
    'codellama:latest',
    'mistral:latest',
    'phi3:latest',
    'deepseek-r1:latest',
    'deepseek-coder:latest'
  ],
  MODEL_DISPLAY_NAMES: {
    'llama3.2:latest': 'Llama 3.2',
    'llama3.2': 'Llama 3.2',
    'codellama:latest': 'CodeLlama',
    'codellama': 'CodeLlama',
    'mistral:latest': 'Mistral',
    'mistral': 'Mistral',
    'phi3:latest': 'Phi-3',
    'phi3': 'Phi-3',
    'deepseek-r1:latest': 'Deepseek-R1',
    'deepseek-r1': 'Deepseek-R1',
    'deepseek-r1:14b': 'Deepseek-R1 14B',
    'deepseek-coder:latest': 'Deepseek Coder',
    'deepseek-coder': 'Deepseek Coder'
  }
} as const;

// Language Configuration
export const LANGUAGE_CONFIG = {
  SUPPORTED_LANGUAGES: [
    'javascript',
    'typescript',
    'python',
    'java',
    'csharp',
    'cpp',
    'go',
    'rust',
    'php',
    'ruby',
    'swift',
    'kotlin',
    'other'
  ],
  LANGUAGE_DISPLAY_NAMES: {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    csharp: 'C#',
    cpp: 'C++',
    go: 'Go',
    rust: 'Rust',
    php: 'PHP',
    ruby: 'Ruby',
    swift: 'Swift',
    kotlin: 'Kotlin',
    other: 'Other'
  }
} as const;

// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  SLOW_RESPONSE_TIME: 5000, // 5 seconds
  VERY_SLOW_RESPONSE_TIME: 10000, // 10 seconds
  MIN_TOKENS_PER_SECOND: 10,
  GOOD_TOKENS_PER_SECOND: 50,
  EXCELLENT_TOKENS_PER_SECOND: 100
} as const;

// File Size Limits
export const FILE_SIZE_LIMITS = {
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10 MB
  MAX_CODE_SIZE: 1 * 1024 * 1024, // 1 MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024 // 5 MB
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  MIN_CODE_LENGTH: 10,
  MAX_CODE_LENGTH: 50000,
  MIN_MESSAGE_LENGTH: 1,
  MAX_MESSAGE_LENGTH: 5000,
  MODEL_NAME_PATTERN: /^[a-zA-Z0-9\-_:.]+$/,
  URL_PATTERN: /^https?:\/\/.+/
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  VALIDATION_ERROR: 'Invalid input. Please check your data.',
  MODEL_NOT_FOUND: 'Model not found. Please select a valid model.',
  CODE_TOO_LONG: 'Code is too long. Maximum length is 50,000 characters.',
  MESSAGE_TOO_LONG: 'Message is too long. Maximum length is 5,000 characters.',
  CACHE_ERROR: 'Cache error. Data may be stale.',
  UNKNOWN_ERROR: 'An unexpected error occurred.'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  MODEL_SWITCHED: 'Model switched successfully',
  MODEL_DOWNLOADED: 'Model downloaded successfully',
  MODEL_DELETED: 'Model deleted successfully',
  CODE_ANALYZED: 'Code analyzed successfully',
  MESSAGE_SENT: 'Message sent successfully',
  CACHE_CLEARED: 'Cache cleared successfully'
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  SELECTED_MODEL: 'selected_model',
  USER_PREFERENCES: 'user_preferences',
  CHAT_HISTORY: 'chat_history',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const;

// Animation Timings
export const ANIMATION_TIMINGS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000
} as const;

// Breakpoints (for responsive design)
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1440,
  WIDE: 1920
} as const;

// Z-Index Layers
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070
} as const;

// Color Palette (for consistency)
export const COLORS = {
  PRIMARY: '#2196F3',
  PRIMARY_DARK: '#1976D2',
  PRIMARY_LIGHT: '#BBDEFB',
  SECONDARY: '#FF9800',
  SUCCESS: '#4CAF50',
  WARNING: '#FFC107',
  ERROR: '#F44336',
  INFO: '#2196F3',
  GRAY_LIGHT: '#F5F5F5',
  GRAY: '#9E9E9E',
  GRAY_DARK: '#424242',
  WHITE: '#FFFFFF',
  BLACK: '#000000'
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: false,
  ENABLE_DEBUG_MODE: false,
  ENABLE_EXPERIMENTAL_FEATURES: false,
  ENABLE_OFFLINE_MODE: false,
  ENABLE_DARK_MODE: false
} as const;

// Regular Expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  PHONE: /^\+?[\d\s\-()]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  CODE_BLOCK: /```[\s\S]*?```/g,
  INLINE_CODE: /`[^`]+`/g
} as const;

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MM/dd/yyyy',
  LONG: 'MMMM dd, yyyy',
  TIME: 'HH:mm:ss',
  DATETIME: 'MM/dd/yyyy HH:mm:ss',
  ISO: 'yyyy-MM-ddTHH:mm:ss.SSSZ'
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_REQUESTS_PER_HOUR: 1000,
  BURST_LIMIT: 10
} as const;

// Export all as a single object for convenience
export const APP_CONSTANTS = {
  API_CONFIG,
  CACHE_CONFIG,
  SIGNALR_CONFIG,
  UI_CONFIG,
  MODEL_CONFIG,
  LANGUAGE_CONFIG,
  PERFORMANCE_THRESHOLDS,
  FILE_SIZE_LIMITS,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  HTTP_STATUS,
  STORAGE_KEYS,
  ANIMATION_TIMINGS,
  BREAKPOINTS,
  Z_INDEX,
  COLORS,
  FEATURE_FLAGS,
  REGEX_PATTERNS,
  DATE_FORMATS,
  PAGINATION,
  RATE_LIMITS
} as const;

