import React, { useState } from "react";
import { Button } from "@patternfly/react-core";
import type { TrackedTab } from "../../types.js";
import { TabActions } from "./TabActions.js";
import { SnoozeDialog } from "./SnoozeDialog.js";

interface ActiveTabListProps {
  tabs: TrackedTab[];
  onMeetingMode: () => void;
  meetingModeActive: boolean;
  onEndMeeting: () => void;
  onRefresh?: () => void;
}

export const ActiveTabList: React.FC<ActiveTabListProps> = ({ tabs, onMeetingMode, meetingModeActive, onEndMeeting, onRefresh }) => {
  const [snoozeTarget, setSnoozeTarget] = useState<number | null>(null);

  const windowIds = [...new Set(tabs.map(t => t.windowId))].sort((a, b) => a - b);
  const windowLabel = (id: number) => `Window ${windowIds.indexOf(id) + 1}`;

  const byWindow = tabs.reduce<Record<number, TrackedTab[]>>((acc, tab) => {
    if (!acc[tab.windowId]) acc[tab.windowId] = [];
    acc[tab.windowId].push(tab);
    return acc;
  }, {});

  const handleSnooze = (tabId: number) => setSnoozeTarget(tabId);

  const handleSnoozeConfirm = async (durationMinutes: number) => {
    if (snoozeTarget === null) return;
    const tab = tabs.find((t) => t.id === snoozeTarget);
    if (!tab) return;
    const wakeAt = Date.now() + durationMinutes * 60000;
    chrome.runtime.sendMessage({
      type: "SNOOZE_FROM_POPUP",
      tabId: snoozeTarget, url: tab.url, title: tab.title, favIconUrl: tab.favIconUrl,
      windowId: tab.windowId, wakeAt,
    }, () => onRefresh?.());
    setSnoozeTarget(null);
  };

  const handleQueue = (tabId: number) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;
    chrome.runtime.sendMessage({
      type: "QUEUE_FROM_POPUP",
      tabId, url: tab.url, title: tab.title, favIconUrl: tab.favIconUrl, windowId: tab.windowId,
    }, () => onRefresh?.());
  };

  const handleWatch = (tabId: number) => {
    // Trigger element selector on the tab
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/element-selector.js"],
    }).then(() => onRefresh?.()).catch(() => {});
  };

  return (
    <div style={{ padding: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontWeight: 600 }}>{tabs.length} active tabs</span>
        {meetingModeActive ? (
          <Button variant="secondary" size="sm" onClick={onEndMeeting}>End Meeting</Button>
        ) : (
          <Button variant="danger" size="sm" onClick={onMeetingMode}>Meeting Mode</Button>
        )}
      </div>
      {Object.entries(byWindow).map(([windowId, windowTabs]) => (
        <div key={windowId} role="list" style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: "#6a6e73", marginBottom: 4 }}>{windowLabel(Number(windowId))} ({windowTabs.length} tabs)</div>
          {windowTabs.map((tab) => (
            <div key={tab.id} role="listitem" tabIndex={0} style={{ display: "flex", alignItems: "center", padding: "2px 0", fontSize: 12 }}>
              {tab.favIconUrl && <img src={tab.favIconUrl} style={{ width: 14, height: 14, marginRight: 4 }} />}
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {tab.pinned ? "[P] " : ""}{tab.title}
              </span>
              {!tab.pinned && <TabActions tab={tab} onSnooze={handleSnooze} onQueue={handleQueue} onWatch={handleWatch} />}
            </div>
          ))}
        </div>
      ))}
      <SnoozeDialog isOpen={snoozeTarget !== null} onClose={() => setSnoozeTarget(null)} onSelect={handleSnoozeConfirm} />
    </div>
  );
};
