import { vi } from "vitest";

// Mock Chrome APIs for extension unit tests
const storageData: Record<string, any> = {};

const chromeStorage = {
  local: {
    get: vi.fn(async (key: string) => {
      if (typeof key === "string") return { [key]: storageData[key] };
      return {};
    }),
    set: vi.fn(async (data: Record<string, any>) => {
      Object.assign(storageData, data);
    }),
  },
};

const alarms: Record<string, { when?: number }> = {};

const chromeAlarms = {
  create: vi.fn(async (name: string, info: { when?: number }) => {
    alarms[name] = info;
  }),
  clear: vi.fn(async (name: string) => {
    delete alarms[name];
    return true;
  }),
};

(globalThis as any).chrome = {
  storage: chromeStorage,
  alarms: chromeAlarms,
  runtime: { sendMessage: vi.fn() },
};

// Helper to reset storage between tests
export function resetChromeStorage(): void {
  for (const key of Object.keys(storageData)) delete storageData[key];
  for (const key of Object.keys(alarms)) delete alarms[key];
  chromeStorage.local.get.mockClear();
  chromeStorage.local.set.mockClear();
  chromeAlarms.create.mockClear();
  chromeAlarms.clear.mockClear();
}

export function getStorageData(): Record<string, any> {
  return storageData;
}

export function getAlarms(): Record<string, { when?: number }> {
  return alarms;
}
