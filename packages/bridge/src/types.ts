export interface ActiveTab {
  id: number;
  windowId: number;
  groupId?: number;  // Chrome tab group ID
  url: string;
  title: string;
  favIconUrl?: string;
  pinned: boolean;
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

export interface Config {
  thresholds: {
    warning: number;
    alert: number;
  };
  staleMinutes: number;
  bridgePort: number;
  defaultPollIntervalMinutes: number;
}

export const DEFAULT_CONFIG: Config = {
  thresholds: {
    warning: 30,
    alert: 50,
  },
  staleMinutes: 120,
  bridgePort: 19876,
  defaultPollIntervalMinutes: 30,
};

export interface LifecycleStats {
  activeTabs: number;
  snoozedTabs: number;
  queuedTabs: number;
  watchingTabs: number;
  tabsByWindow: Record<number, number>;
  staleTabs: number;
  topDomains: { domain: string; count: number }[];
  nextSnoozeWake: number | null;
  watchedChanges: number;
}

export type WebSocketMessageType =
  | "state-sync"
  | "state-change"
  | "command"
  | "tabs-update";

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: unknown;
}

export interface StateSyncPayload {
  activeTabs: ActiveTab[];
  lifecycleTabs: LifecycleTab[];
}

export interface StateChangePayload {
  action: "snooze" | "queue" | "watch" | "wake" | "remove";
  tab: LifecycleTab;
}

export interface CommandPayload {
  command: "snooze" | "queue" | "watch" | "wake" | "remove" | "meeting-start" | "meeting-end";
  tabIds?: number[];
  lifecycleIds?: string[];
  wakeAt?: number;
  cssSelector?: string;
  pollIntervalMinutes?: number;
}
