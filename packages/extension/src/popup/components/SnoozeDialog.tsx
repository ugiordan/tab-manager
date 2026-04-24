import React from "react";
import { Modal, ModalVariant, Button, SimpleList, SimpleListItem } from "@patternfly/react-core";

interface SnoozeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (durationMinutes: number) => void;
}

export const SnoozeDialog: React.FC<SnoozeDialogProps> = ({ isOpen, onClose, onSelect }) => {
  const options = [
    { label: "1 hour", minutes: 60 },
    { label: "2 hours", minutes: 120 },
    { label: "Tomorrow 9am", minutes: getMinutesUntil(9, 1) },
    { label: "Next Monday 9am", minutes: getMinutesUntilMonday() },
  ];

  return (
    <Modal
      variant={ModalVariant.small}
      title="Snooze tab"
      isOpen={isOpen}
      onClose={onClose}
    >
      <SimpleList>
        {options.map((opt) => (
          <SimpleListItem key={opt.label} onClick={() => { onSelect(opt.minutes); onClose(); }}>
            {opt.label}
          </SimpleListItem>
        ))}
      </SimpleList>
    </Modal>
  );
};

function getMinutesUntil(hour: number, daysAhead: number): number {
  const target = new Date();
  target.setDate(target.getDate() + daysAhead);
  target.setHours(hour, 0, 0, 0);
  return Math.round((target.getTime() - Date.now()) / 60000);
}

function getMinutesUntilMonday(): number {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const target = new Date();
  target.setDate(target.getDate() + daysUntilMonday);
  target.setHours(9, 0, 0, 0);
  return Math.round((target.getTime() - Date.now()) / 60000);
}
