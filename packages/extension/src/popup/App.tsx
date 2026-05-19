import React, { useEffect, useState } from "react";
import { Tabs, Tab, TabTitleText, Spinner } from "@patternfly/react-core";
import { Header } from "./components/Header.js";
import { ActiveTabList } from "./components/ActiveTabList.js";
import { SnoozedList } from "./components/SnoozedList.js";
import { QueueList } from "./components/QueueList.js";
import { WatchingList } from "./components/WatchingList.js";
import { RestoreBanner } from "./components/RestoreBanner.js";
import { TrackedTab, LifecycleTab } from "../types.js";
import type { SnapshotTab } from "../background/session-snapshot.js";

export const App: React.FC = () => {
  const [tabs, setTabs] = useState<TrackedTab[]>([]);
  const [snoozed, setSnoozed] = useState<LifecycleTab[]>([]);
  const [queued, setQueued] = useState<LifecycleTab[]>([]);
  const [watching, setWatching] = useState<LifecycleTab[]>([]);
  const [meetingModeActive, setMeetingModeActive] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<SnapshotTab[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    chrome.runtime.sendMessage({ type: "GET_TABS" }, (r) => { if (r?.tabs) setTabs(r.tabs); setLoading(false); });
    chrome.runtime.sendMessage({ type: "GET_LIFECYCLE", state: "snoozed" }, (r) => { if (r?.tabs) setSnoozed(r.tabs); });
    chrome.runtime.sendMessage({ type: "GET_LIFECYCLE", state: "queued" }, (r) => { if (r?.tabs) setQueued(r.tabs); });
    chrome.runtime.sendMessage({ type: "GET_LIFECYCLE", state: "watching" }, (r) => { if (r?.tabs) setWatching(r.tabs); });
    chrome.storage.local.get("meetingMode", (stored) => { setMeetingModeActive(stored.meetingMode?.active ?? false); });
    chrome.runtime.sendMessage({ type: "GET_PENDING_RESTORE" }, (r) => { if (r?.tabs) setPendingRestore(r.tabs); });
    chrome.runtime.sendMessage({ type: "CLEAR_ATTENTION" });
  };

  useEffect(() => { loadData(); }, []);

  const handleMeetingMode = () => {
    chrome.runtime.sendMessage({ type: "MEETING_MODE" }, () => { setMeetingModeActive(true); loadData(); });
  };
  const handleEndMeeting = () => {
    chrome.runtime.sendMessage({ type: "END_MEETING" }, () => { setMeetingModeActive(false); loadData(); });
  };
  const handleWake = (id: string) => {
    chrome.runtime.sendMessage({ type: "WAKE_TAB", lifecycleId: id }, () => loadData());
  };
  const handleRemove = (id: string) => {
    chrome.runtime.sendMessage({ type: "REMOVE_TAB", lifecycleId: id }, () => loadData());
  };
  const handleWakeAllSnoozed = () => {
    chrome.runtime.sendMessage({ type: "WAKE_ALL", state: "snoozed" }, () => loadData());
  };
  const handleOpenAllQueued = () => {
    chrome.runtime.sendMessage({ type: "WAKE_ALL", state: "queued" }, () => loadData());
  };
  const handleQueueNext = () => {
    chrome.runtime.sendMessage({ type: "QUEUE_NEXT" }, () => loadData());
  };
  const handleRestoreAll = () => {
    const urls = pendingRestore.map((t) => t.url);
    chrome.runtime.sendMessage({ type: "RESTORE_TABS", urls }, () => { setPendingRestore([]); loadData(); });
  };
  const handleRestoreSelected = (urls: string[]) => {
    chrome.runtime.sendMessage({ type: "RESTORE_TABS", urls }, () => loadData());
    setPendingRestore((prev) => prev.filter((t) => !urls.includes(t.url)));
  };
  const handleDismissRestore = () => {
    chrome.runtime.sendMessage({ type: "DISMISS_RESTORE" });
    setPendingRestore([]);
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40, width: 400 }}><Spinner /></div>;

  return (
    <div style={{ width: 400, maxHeight: 500, overflow: "auto" }}>
      {pendingRestore.length > 0 && (
        <RestoreBanner tabs={pendingRestore} onRestoreAll={handleRestoreAll} onDismiss={handleDismissRestore} onRestoreSelected={handleRestoreSelected} />
      )}
      <Header activeTabs={tabs} snoozedCount={snoozed.length} queuedCount={queued.length} watchingCount={watching.length} />
      <Tabs activeKey={activeTab} onSelect={(_e, key) => setActiveTab(key as number)}>
        <Tab eventKey={0} title={<TabTitleText>Active ({tabs.length})</TabTitleText>}>
          <ActiveTabList tabs={tabs} onMeetingMode={handleMeetingMode} meetingModeActive={meetingModeActive} onEndMeeting={handleEndMeeting} onRefresh={loadData} />
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Snoozed ({snoozed.length})</TabTitleText>}>
          <SnoozedList tabs={snoozed} onWake={handleWake} onWakeAll={handleWakeAllSnoozed} onRemove={handleRemove} />
        </Tab>
        <Tab eventKey={2} title={<TabTitleText>Queued ({queued.length})</TabTitleText>}>
          <QueueList tabs={queued} onNext={handleQueueNext} onOpenAll={handleOpenAllQueued} onRemove={handleRemove} />
        </Tab>
        <Tab eventKey={3} title={<TabTitleText>Watching ({watching.length})</TabTitleText>}>
          <WatchingList tabs={watching} onOpen={handleWake} onRemove={handleRemove} />
        </Tab>
      </Tabs>
    </div>
  );
};
