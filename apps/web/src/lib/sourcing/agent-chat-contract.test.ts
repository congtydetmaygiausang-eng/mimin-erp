import assert from "node:assert/strict";
import test from "node:test";

import { buildAgentChatMessages } from "./agent-chat-contract";

test("agent chat request includes the current user message", () => {
  assert.deepEqual(buildAgentChatMessages([], "  Tìm nhà cung cấp vải cotton  "), [
    { role: "user", content: "Tìm nhà cung cấp vải cotton" },
  ]);
});

test("agent chat request keeps only bounded history before the current message", () => {
  const history = Array.from({ length: 8 }, (_, index) => ({
    role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
    content: `message-${index}`,
  }));

  const messages = buildAgentChatMessages(history, "follow-up", 6);
  assert.equal(messages.length, 7);
  assert.equal(messages[0]?.content, "message-2");
  assert.deepEqual(messages.at(-1), { role: "user", content: "follow-up" });
});

test("agent chat request rejects an empty current message", () => {
  assert.deepEqual(buildAgentChatMessages([], "   "), []);
});
