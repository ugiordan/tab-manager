import React from "react";
import type { TrackedTab } from "../../types.js";

interface HeaderProps {
  activeTabs: TrackedTab[];
  snoozedCount: number;
  queuedCount: number;
  watchingCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTabs, snoozedCount, queuedCount, watchingCount }) => {
  const windowCount = new Set(activeTabs.map((t) => t.windowId)).size;
  return (
    <div style={{ padding: "8px 12px", borderBottom: "1px solid #d2d2d2" }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>Tab Lifecycle Manager</div>
      <div style={{ fontSize: 11, color: "#6a6e73" }}>
        {activeTabs.length} active across {windowCount} window(s)
        {snoozedCount > 0 && ` | ${snoozedCount} snoozed`}
        {queuedCount > 0 && ` | ${queuedCount} queued`}
        {watchingCount > 0 && ` | ${watchingCount} watching`}
      </div>
    </div>
  );
};
