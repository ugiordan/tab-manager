import fs from "node:fs";
import path from "node:path";
import { Config, DEFAULT_CONFIG, LifecycleTab, LifecycleState, ActiveTab } from "./types.js";

export class Storage {
  private lifecyclePath: string;
  private configPath: string;
  private activeTabsPath: string;

  constructor(private baseDir: string) {
    fs.mkdirSync(baseDir, { recursive: true });
    this.lifecyclePath = path.join(baseDir, "lifecycle.json");
    this.configPath = path.join(baseDir, "config.json");
    this.activeTabsPath = path.join(baseDir, "active-tabs.json");
  }

  getConfig(): Config {
    if (!fs.existsSync(this.configPath)) return { ...DEFAULT_CONFIG };
    const raw = fs.readFileSync(this.configPath, "utf-8");
    return JSON.parse(raw) as Config;
  }

  saveConfig(config: Config): void {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  private readLifecycleStore(): LifecycleTab[] {
    if (!fs.existsSync(this.lifecyclePath)) return [];
    const raw = fs.readFileSync(this.lifecyclePath, "utf-8");
    return JSON.parse(raw) as LifecycleTab[];
  }

  private writeLifecycleStore(tabs: LifecycleTab[]): void {
    fs.writeFileSync(this.lifecyclePath, JSON.stringify(tabs, null, 2));
  }

  saveLifecycleTab(tab: LifecycleTab): void {
    const tabs = this.readLifecycleStore();
    const idx = tabs.findIndex((t) => t.id === tab.id);
    if (idx >= 0) {
      tabs[idx] = tab;
    } else {
      tabs.push(tab);
    }
    this.writeLifecycleStore(tabs);
  }

  getLifecycleTab(id: string): LifecycleTab | null {
    const tabs = this.readLifecycleStore();
    return tabs.find((t) => t.id === id) ?? null;
  }

  listLifecycleTabs(state?: LifecycleState): LifecycleTab[] {
    const tabs = this.readLifecycleStore();
    if (state) return tabs.filter((t) => t.state === state);
    return tabs;
  }

  removeLifecycleTab(id: string): boolean {
    const tabs = this.readLifecycleStore();
    const filtered = tabs.filter((t) => t.id !== id);
    if (filtered.length === tabs.length) return false;
    this.writeLifecycleStore(filtered);
    return true;
  }

  saveActiveTabs(tabs: ActiveTab[]): void {
    fs.writeFileSync(this.activeTabsPath, JSON.stringify(tabs, null, 2));
  }

  getActiveTabs(): ActiveTab[] {
    if (!fs.existsSync(this.activeTabsPath)) return [];
    const raw = fs.readFileSync(this.activeTabsPath, "utf-8");
    return JSON.parse(raw) as ActiveTab[];
  }
}
