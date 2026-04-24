import React from "react";
import { Button } from "@patternfly/react-core";
import type { LifecycleTab } from "../../types.js";

interface SnoozedListProps {
  tabs: LifecycleTab[];
  onWake: (id: string) => void;
  onRemove: (id: string) => void;
}

export const SnoozedList: React.FC<SnoozedListProps> = ({ tabs, onWake, onRemove }) => {
  if (tabs.length === 0) {
    return <div style={{ padding: 16, textAlign: "center", color: "#6a6e73" }}>No snoozed tabs</div>;
  }

  return (
    <div style={{ padding: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{tabs.length} snoozed</div>
      <div role="list">{tabs.map((tab) => {
        const timeLeft = tab.wakeAt ? tab.wakeAt - Date.now() : 0;
        const minsLeft = Math.max(0, Math.round(timeLeft / 60000));
        const hoursLeft = Math.floor(minsLeft / 60);
        const countdown = tab.meetingId
          ? "meeting"
          : hoursLeft > 0 ? `${hoursLeft}h ${minsLeft % 60}m` : `${minsLeft}m`;

        return (
          <div key={tab.id} role="listitem" tabIndex={0} style={{ display: "flex", alignItems: "center", padding: "4px 0", fontSize: 12 }}>
            {tab.favIconUrl && <img src={tab.favIconUrl} alt="" style={{ width: 14, height: 14, marginRight: 4 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {tab.title}
            </span>
            <span style={{ color: "#6a6e73", marginRight: 8, fontSize: 11 }}>{countdown}</span>
            <Button variant="link" size="sm" onClick={() => onWake(tab.id)}>Wake</Button>
            <Button variant="plain" size="sm" onClick={() => onRemove(tab.id)}>x</Button>
          </div>
        );
      })}</div>
    </div>
  );
};
