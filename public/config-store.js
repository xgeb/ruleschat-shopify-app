const STORAGE_KEY = 'ruleschat:config:v1';

const clone = (value) => JSON.parse(JSON.stringify(value));

export const loadConfig = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.warn('Unable to load saved config.', error);
    return null;
  }
};

export const saveConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('Unable to save config.', error);
  }
};

export const resetConfig = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to reset config.', error);
  }
};

export const getStorageKey = () => STORAGE_KEY;
