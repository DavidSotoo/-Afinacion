// Simple in-memory fallback for environments with blocked storage (e.g., WebView, private browsing)
const memoryStorage = {
  local: {},
  session: {}
};

export const safeLocalStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('localStorage is blocked/unavailable. Using memory fallback.', e);
    }
    return memoryStorage.local[key] || null;
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn('localStorage is blocked/unavailable. Using memory fallback.', e);
    }
    memoryStorage.local[key] = String(value);
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn('localStorage is blocked/unavailable. Using memory fallback.', e);
    }
    delete memoryStorage.local[key];
  }
};

export const safeSessionStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return sessionStorage.getItem(key);
      }
    } catch (e) {
      console.warn('sessionStorage is blocked/unavailable. Using memory fallback.', e);
    }
    return memoryStorage.session[key] || null;
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn('sessionStorage is blocked/unavailable. Using memory fallback.', e);
    }
    memoryStorage.session[key] = String(value);
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn('sessionStorage is blocked/unavailable. Using memory fallback.', e);
    }
    delete memoryStorage.session[key];
  }
};
