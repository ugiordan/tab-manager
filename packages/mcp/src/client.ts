interface TabData { id: number; url: string; title: string; [key: string]: unknown; }
interface LifecycleTabData { id: string; url: string; title: string; state: string; [key: string]: unknown; }
interface StatsData { activeTabs: number; snoozedTabs: number; queuedTabs: number; watchingTabs: number; staleTabs: number; topDomains: { domain: string; count: number }[]; nextSnoozeWake: number | null; watchedChanges: number; [key: string]: unknown; }

export class BridgeClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string, timeout = 5000) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeout = timeout;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: { "Content-Type": "application/json", ...options.headers },
      });
      if (!res.ok) {
        let detail = "";
        try { const body = await res.json(); detail = body.error || ""; } catch {}
        throw new Error(`Bridge returned ${res.status}${detail ? `: ${detail}` : ""}`);
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async listTabs(): Promise<{ tabs: TabData[] }> { return this.request("/tabs"); }
  async listLifecycle(state?: string): Promise<{ tabs: LifecycleTabData[] }> {
    const path = state ? `/lifecycle/${encodeURIComponent(state)}` : "/lifecycle";
    return this.request(path);
  }
  async snooze(data: { url: string; title: string; originWindowId: number; wakeAt: number; favIconUrl?: string }): Promise<{ tab: LifecycleTabData }> {
    return this.request("/lifecycle/snooze", { method: "POST", body: JSON.stringify(data) });
  }
  async queue(data: { url: string; title: string; originWindowId: number; favIconUrl?: string }): Promise<{ tab: LifecycleTabData }> {
    return this.request("/lifecycle/queue", { method: "POST", body: JSON.stringify(data) });
  }
  async watch(data: { url: string; title: string; originWindowId: number; cssSelector: string; pollIntervalMinutes?: number; favIconUrl?: string }): Promise<{ tab: LifecycleTabData }> {
    return this.request("/lifecycle/watch", { method: "POST", body: JSON.stringify(data) });
  }
  async wake(id: string): Promise<{ tab: LifecycleTabData }> {
    return this.request(`/lifecycle/${encodeURIComponent(id)}/wake`, { method: "POST" });
  }
  async remove(id: string): Promise<{ removed: boolean }> {
    return this.request(`/lifecycle/${encodeURIComponent(id)}`, { method: "DELETE" });
  }
  async meetingStart(): Promise<{ meetingId: string; snoozedCount: number; pinnedKept: number }> {
    return this.request("/meeting/start", { method: "POST" });
  }
  async meetingEnd(meetingId?: string): Promise<{ wokenCount: number; tabs: LifecycleTabData[] }> {
    return this.request("/meeting/end", { method: "POST", body: JSON.stringify({ meetingId }) });
  }
  async stats(): Promise<StatsData> { return this.request("/stats"); }
}
