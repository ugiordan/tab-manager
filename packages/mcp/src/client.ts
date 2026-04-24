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
        const body = await res.text();
        throw new Error(`Bridge returned ${res.status}: ${body}`);
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async health(): Promise<{ status: string }> { return this.request("/health"); }
  async listTabs(): Promise<{ tabs: any[] }> { return this.request("/tabs"); }
  async syncTabs(tabs: any[]): Promise<{ synced: number }> {
    return this.request("/tabs/sync", { method: "POST", body: JSON.stringify({ tabs }) });
  }
  async listLifecycle(state?: string): Promise<{ tabs: any[] }> {
    const path = state ? `/lifecycle/${state}` : "/lifecycle";
    return this.request(path);
  }
  async snooze(data: { url: string; title: string; originWindowId: number; wakeAt: number; favIconUrl?: string }): Promise<{ tab: any }> {
    return this.request("/lifecycle/snooze", { method: "POST", body: JSON.stringify(data) });
  }
  async queue(data: { url: string; title: string; originWindowId: number; favIconUrl?: string }): Promise<{ tab: any }> {
    return this.request("/lifecycle/queue", { method: "POST", body: JSON.stringify(data) });
  }
  async watch(data: { url: string; title: string; originWindowId: number; cssSelector: string; pollIntervalMinutes?: number; favIconUrl?: string }): Promise<{ tab: any }> {
    return this.request("/lifecycle/watch", { method: "POST", body: JSON.stringify(data) });
  }
  async wake(id: string): Promise<{ tab: any }> {
    return this.request(`/lifecycle/${id}/wake`, { method: "POST" });
  }
  async removeLifecycle(id: string): Promise<{ removed: boolean }> {
    return this.request(`/lifecycle/${id}`, { method: "DELETE" });
  }
  async meetingStart(): Promise<{ meetingId: string; snoozedCount: number; pinnedKept: number }> {
    return this.request("/meeting/start", { method: "POST" });
  }
  async meetingEnd(meetingId?: string): Promise<{ wokenCount: number; tabs: any[] }> {
    return this.request("/meeting/end", { method: "POST", body: JSON.stringify({ meetingId }) });
  }
  async stats(): Promise<any> { return this.request("/stats"); }
}
