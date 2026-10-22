
const KEY = 'deviceId';

function createId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function getDeviceId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = createId();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    if (!window.__deviceId) window.__deviceId = createId();
    return window.__deviceId;
  }
}
