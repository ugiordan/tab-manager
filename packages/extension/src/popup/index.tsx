import React from "react";
import { createRoot } from "react-dom/client";
import "@patternfly/react-core/dist/styles/base.css";
import { App } from "./App.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";

const root = createRoot(document.getElementById("root")!);
root.render(<ErrorBoundary><App /></ErrorBoundary>);
