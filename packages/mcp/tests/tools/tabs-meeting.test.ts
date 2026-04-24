import { describe, it, expect, vi } from "vitest";
import { handleTabsMeeting } from "../../src/tools/tabs-meeting.js";
import { BridgeClient } from "../../src/client.js";

describe("tabs-meeting tool", () => {
  it("starts meeting mode", async () => {
    const client = {
      meetingStart: vi.fn().mockResolvedValue({
        meetingId: "m123",
        snoozedCount: 10,
        pinnedKept: 3
      })
    } as unknown as BridgeClient;
    const result = await handleTabsMeeting(client, { action: "start" });
    expect(result.content[0].text).toContain("Meeting mode started");
    expect(result.content[0].text).toContain("Snoozed 10");
    expect(result.content[0].text).toContain("kept 3");
  });

  it("ends meeting mode", async () => {
    const client = {
      meetingEnd: vi.fn().mockResolvedValue({
        wokenCount: 10,
        tabs: []
      })
    } as unknown as BridgeClient;
    const result = await handleTabsMeeting(client, { action: "end", meeting_id: "m123" });
    expect(result.content[0].text).toContain("Meeting mode ended");
    expect(result.content[0].text).toContain("Woke 10");
  });
});
