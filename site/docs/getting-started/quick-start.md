# Quick Start

Once the extension is loaded, here's how to use each feature.

## Snooze a Tab

Right-click on any page and select **Snooze tab**:

- **1 hour** / **2 hours**: reopens after the duration
- **Tomorrow 9am**: reopens the next day at 9:00
- **Next Monday 9am**: reopens next Monday at 9:00

The tab closes immediately. When the time comes, it reopens automatically and you get a notification.

You can also snooze from the popup by clicking **S** next to any active tab.

## Queue a Tab

Right-click and select **Queue tab for later**, or click **Q** in the popup.

The tab moves to an ordered queue. When you're ready, click **Next** in the popup's Queue tab to pull the next item.

!!! info "Queue ordering"
    Tabs enter the queue in the order you add them. You can drag to reorder in the popup.

## Watch a Tab for Changes

Right-click and select **Watch tab for changes...**

An overlay appears. Hover over the element you want to monitor (a price, a status badge, a comment count) and click it. The extension captures a CSS selector for that element.

The tab closes. Every 5 minutes (configurable), the extension polls the page and hashes the selected element's text content. If it changes, you get a notification.

## Meeting Mode

Open the popup and click **Meeting Mode**. All unpinned tabs across all windows get snoozed. A blank tab stays in each window so no windows close.

When you're done, click **End Meeting** to restore everything.

## Managing Lifecycle Tabs

The popup has four tabs:

| Tab | Shows | Actions |
|-----|-------|---------|
| **Active** | All open tabs grouped by window | Snooze, Queue, Watch |
| **Snoozed** | Tabs waiting to wake | Wake now, Remove |
| **Queued** | Ordered list | Next, Reorder, Remove |
| **Watching** | Monitored tabs with change status | Open, Stop watching, Remove |
