import React from "react";
import { Button, Tooltip } from "@patternfly/react-core";
import type { TrackedTab } from "../../types.js";

interface TabActionsProps {
  tab: TrackedTab;
  onSnooze: (tabId: number) => void;
  onQueue: (tabId: number) => void;
  onWatch: (tabId: number) => void;
}

export const TabActions: React.FC<TabActionsProps> = ({ tab, onSnooze, onQueue, onWatch }) => {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      <Tooltip content="Snooze tab">
        <Button variant="plain" size="sm" onClick={() => onSnooze(tab.id)}>S</Button>
      </Tooltip>
      <Tooltip content="Queue for later">
        <Button variant="plain" size="sm" onClick={() => onQueue(tab.id)}>Q</Button>
      </Tooltip>
      <Tooltip content="Watch for changes">
        <Button variant="plain" size="sm" onClick={() => onWatch(tab.id)}>W</Button>
      </Tooltip>
    </div>
  );
};
