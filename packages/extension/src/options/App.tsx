import React, { useEffect, useState } from "react";
import { Card, CardBody, CardTitle, FormGroup, TextInput, ActionGroup, Button, Alert, HelperText, HelperTextItem } from "@patternfly/react-core";
import { ExtensionConfig, DEFAULT_EXTENSION_CONFIG, isLocalhostUrl } from "../types.js";

export const App: React.FC = () => {
  const [config, setConfig] = useState<ExtensionConfig>(DEFAULT_EXTENSION_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage.local.get("config", (stored) => {
      if (stored.config) setConfig(stored.config);
    });
  }, []);

  const [bridgeError, setBridgeError] = useState("");

  const handleSave = () => {
    if (!isLocalhostUrl(config.bridgeUrl)) {
      setBridgeError("Bridge URL must point to localhost or 127.0.0.1");
      return;
    }
    setBridgeError("");
    chrome.storage.local.set({ config });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 500, margin: "20px auto" }}>
      <Card>
        <CardTitle>Tab Lifecycle Manager Settings</CardTitle>
        <CardBody>
          {saved && <Alert variant="success" isInline title="Settings saved" style={{ marginBottom: 12 }} />}

          <FormGroup label="Warning threshold (tab count)" fieldId="warning">
            <TextInput type="number" id="warning" min={1} value={config.thresholds.warning}
              onChange={(_e, val) => setConfig({ ...config, thresholds: { ...config.thresholds, warning: Math.max(1, parseInt(val) || 1) } })} />
          </FormGroup>

          <FormGroup label="Alert threshold (tab count)" fieldId="alert">
            <TextInput type="number" id="alert" min={1} value={config.thresholds.alert}
              onChange={(_e, val) => setConfig({ ...config, thresholds: { ...config.thresholds, alert: Math.max(1, parseInt(val) || 1) } })} />
          </FormGroup>

          <FormGroup label="Stale tab threshold (minutes)" fieldId="stale">
            <TextInput type="number" id="stale" min={1} value={config.staleMinutes}
              onChange={(_e, val) => setConfig({ ...config, staleMinutes: Math.max(1, parseInt(val) || 1) })} />
          </FormGroup>

          <FormGroup label="Default snooze duration (minutes)" fieldId="snooze">
            <TextInput type="number" id="snooze" min={1} value={config.defaultSnoozeDurationMinutes}
              onChange={(_e, val) => setConfig({ ...config, defaultSnoozeDurationMinutes: Math.max(1, parseInt(val) || 1) })} />
          </FormGroup>

          <FormGroup label="Watch poll interval (minutes)" fieldId="poll">
            <TextInput type="number" id="poll" min={1} value={config.defaultPollIntervalMinutes}
              onChange={(_e, val) => setConfig({ ...config, defaultPollIntervalMinutes: Math.max(1, parseInt(val) || 1) })} />
          </FormGroup>

          <FormGroup label="Bridge server URL" fieldId="bridge">
            <TextInput id="bridge" value={config.bridgeUrl}
              validated={bridgeError ? "error" : "default"}
              onChange={(_e, val) => { setBridgeError(""); setConfig({ ...config, bridgeUrl: val }); }} />
            <HelperText>
              <HelperTextItem variant={bridgeError ? "error" : "default"}>
                {bridgeError || "Must be localhost or 127.0.0.1"}
              </HelperTextItem>
            </HelperText>
          </FormGroup>

          <ActionGroup>
            <Button onClick={handleSave}>Save</Button>
          </ActionGroup>
        </CardBody>
      </Card>
    </div>
  );
};
