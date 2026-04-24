import React from "react";
import { Button } from "@patternfly/react-core";
import type { LifecycleTab } from "../../types.js";

interface QueueListProps {
  tabs: LifecycleTab[];
  onNext: () => void;
  onRemove: (id: string) => void;
}

export const QueueList: React.FC<QueueListProps> = ({ tabs, onNext, onRemove }) => {
  const sorted = [...tabs].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  if (sorted.length === 0) {
    return <div style={{ padding: 16, textAlign: "center", color: "#6a6e73" }}>Queue is empty</div>;
  }

  return (
    <div style={{ padding: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontWeight: 600 }}>{sorted.length} queued</span>
        <Button variant="primary" size="sm" onClick={onNext}>Next</Button>
      </div>
      <div role="list">{sorted.map((tab, i) => (
        <div key={tab.id} role="listitem" tabIndex={0} style={{ display: "flex", alignItems: "center", padding: "4px 0", fontSize: 12 }}>
          <span style={{ color: "#6a6e73", marginRight: 8, fontSize: 11, width: 20 }}>{i + 1}.</span>
          {tab.favIconUrl && <img src={tab.favIconUrl} alt="" style={{ width: 14, height: 14, marginRight: 4 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {tab.title}
          </span>
          <Button variant="plain" size="sm" onClick={() => onRemove(tab.id)}>x</Button>
        </div>
      ))}</div>
    </div>
  );
};
