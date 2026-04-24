export interface TrackedTab {
  id: number;
  windowId: number;
  url: string;
  title: string;
  favIconUrl?: string;
  pinned: boolean;
  groupId: number;
  index: number;
  lastAccessed: number;
  createdAt: number;
}

export type LifecycleState = "snoozed" | "queued" | "watching";

export interface LifecycleTab {
  id: string;
  url: string;
  title: string;
  favIconUrl?: string;
  state: LifecycleState;
  createdAt: number;
  originWindowId: number;

  // Snoozed
  wakeAt?: number;

  // Queued
  position?: number;

  // Watching
  cssSelector?: string;
  pollIntervalMinutes?: number;
  lastCheckedAt?: number;
  lastContentHash?: string;
  changedAt?: number | null;

  // Meeting mode tag
  meetingId?: string;
}

export interface ExtensionConfig {
  thresholds: { warning: number; alert: number };
  staleMinutes: number;
  bridgeUrl: string;
  defaultPollIntervalMinutes: number;
  defaultSnoozeDurationMinutes: number;
}

export const DEFAULT_EXTENSION_CONFIG: ExtensionConfig = {
  thresholds: { warning: 30, alert: 50 },
  staleMinutes: 120,
  bridgeUrl: "http://localhost:19876",
  defaultPollIntervalMinutes: 30,
  defaultSnoozeDurationMinutes: 60,
};

export interface StoredState {
  lifecycle: LifecycleTab[];
  meetingMode: { active: boolean; meetingId: string | null };
  attention: { snoozesWoken: string[]; watchesChanged: string[] };
}

export const DEFAULT_STORED_STATE: StoredState = {
  lifecycle: [],
  meetingMode: { active: false, meetingId: null },
  attention: { snoozesWoken: [], watchesChanged: [] },
};

export function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}
