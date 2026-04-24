import React from "react";
import { FormGroup, NumberInput, FormHelperText, HelperText, HelperTextItem } from "@patternfly/react-core";

interface StaleSettingsProps { staleMinutes: number; onChange: (v: number) => void; }

export const StaleSettings: React.FC<StaleSettingsProps> = ({ staleMinutes, onChange }) => (
  <FormGroup label="Stale tab threshold (minutes)" fieldId="stale-minutes">
    <NumberInput id="stale-minutes" value={staleMinutes} min={15} max={480}
      onMinus={() => onChange(staleMinutes - 15)} onPlus={() => onChange(staleMinutes + 15)}
      onChange={(event) => onChange(Number((event.target as HTMLInputElement).value))} />
    <FormHelperText><HelperText><HelperTextItem>Tabs inactive longer than this are flagged as stale</HelperTextItem></HelperText></FormHelperText>
  </FormGroup>
);
