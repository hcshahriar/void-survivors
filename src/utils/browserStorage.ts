import type { StorageLike } from '../core/save';

export const browserStorage: StorageLike = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    localStorage.setItem(key, value);
  },
};
