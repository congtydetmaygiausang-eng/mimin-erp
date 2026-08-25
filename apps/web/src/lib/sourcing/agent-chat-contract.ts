export interface AgentChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function buildAgentChatMessages(
  history: readonly AgentChatMessage[],
  currentMessage: string,
  maxHistoryMessages = 6,
): AgentChatMessage[] {
  const trimmed = currentMessage.trim();
  if (!trimmed) return [];

  return [
    ...history.slice(-maxHistoryMessages).map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user" as const, content: trimmed },
  ];
}
