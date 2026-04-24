import React from "react";
import { FormGroup, NumberInput, FormHelperText, HelperText, HelperTextItem } from "@patternfly/react-core";

interface ThresholdSettingsProps { warning: number; alert: number; onWarningChange: (v: number) => void; onAlertChange: (v: number) => void; }

export const ThresholdSettings: React.FC<ThresholdSettingsProps> = ({ warning, alert, onWarningChange, onAlertChange }) => (
  <>
    <FormGroup label="Warning threshold (yellow badge)" fieldId="warning-threshold">
      <NumberInput id="warning-threshold" value={warning} min={1} max={200}
        onMinus={() => onWarningChange(warning - 1)} onPlus={() => onWarningChange(warning + 1)}
        onChange={(event) => onWarningChange(Number((event.target as HTMLInputElement).value))} />
      <FormHelperText><HelperText><HelperTextItem>Badge turns yellow at this tab count</HelperTextItem></HelperText></FormHelperText>
    </FormGroup>
    <FormGroup label="Alert threshold (red badge)" fieldId="alert-threshold">
      <NumberInput id="alert-threshold" value={alert} min={1} max={500}
        onMinus={() => onAlertChange(alert - 1)} onPlus={() => onAlertChange(alert + 1)}
        onChange={(event) => onAlertChange(Number((event.target as HTMLInputElement).value))} />
      <FormHelperText><HelperText><HelperTextItem>Badge turns red at this tab count</HelperTextItem></HelperText></FormHelperText>
    </FormGroup>
  </>
);
