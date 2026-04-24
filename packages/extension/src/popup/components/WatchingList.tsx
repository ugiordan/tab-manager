import React from "react";
import { Button, Label } from "@patternfly/react-core";
import type { LifecycleTab } from "../../types.js";

interface WatchingListProps {
  tabs: LifecycleTab[];
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
}

export const WatchingList: React.FC<WatchingListProps> = ({ tabs, onOpen, onRemove }) => {
  if (tabs.length === 0) {
    return <div style={{ padding: 16, textAlign: "center", color: "#6a6e73" }}>No watched tabs</div>;
  }

  return (
    <div style={{ padding: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{tabs.length} watching</div>
      <div role="list">{tabs.map((tab) => {
        const hasChanged = tab.changedAt !== null && tab.changedAt !== undefined;
        const lastChecked = tab.lastCheckedAt
          ? `${Math.round((Date.now() - tab.lastCheckedAt) / 60000)}m ago`
          : "never";

        return (
          <div key={tab.id} role="listitem" tabIndex={0} style={{ display: "flex", alignItems: "center", padding: "4px 0", fontSize: 12 }}>
            {tab.favIconUrl && <img src={tab.favIconUrl} style={{ width: 14, height: 14, marginRight: 4 }} />}
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {tab.title}
            </span>
            {hasChanged && <Label color="blue" isCompact style={{ marginRight: 4 }}>Changed</Label>}
            <span style={{ color: "#6a6e73", fontSize: 11, marginRight: 8 }}>{lastChecked}</span>
            <Button variant="link" size="sm" onClick={() => onOpen(tab.id)}>Open</Button>
            <Button variant="plain" size="sm" onClick={() => onRemove(tab.id)}>x</Button>
          </div>
        );
      })}</div>
    </div>
  );
};
