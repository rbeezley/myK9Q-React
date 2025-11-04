/**
 * Test setup file for Vitest
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock environment variables
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      signIn: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    channel: vi.fn(() => ({
      on: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
  },
}));

// Mock window.matchMedia (for dark mode detection)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock navigator.onLine (make it configurable so tests can override it)
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  configurable: true,
  value: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage  
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock window.addEventListener for online/offline events
const originalAddEventListener = window.addEventListener.bind(window);
window.addEventListener = vi.fn((event: string, handler: any) => {
  if (event === 'online' || event === 'offline') {
    // Mock implementation for network events
    return;
  }
  return originalAddEventListener(event as any, handler);
}) as any;

// Mock IndexedDB for local-first storage
const indexedDBMock = {
  open: vi.fn(() => {
    const request: any = {
      result: null,
      error: null as Error | null,
      onsuccess: null as any,
      onerror: null as any,
      onupgradeneeded: null as any,
    };
    // Immediately fail to prevent actual DB operations in tests
    setTimeout(() => {
      if (request.onerror) {
        request.error = new Error('IndexedDB not available in test environment');
        (request.onerror as any)({ target: request });
      }
    }, 0);
    return request;
  }),
  deleteDatabase: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: indexedDBMock,
});