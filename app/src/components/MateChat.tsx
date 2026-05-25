"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDateTime } from "@/lib/utils";
import type {
  Assessment,
  ChatConflictWindow,
  ChatStudyBlock,
  ChatTurn,
} from "@/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  study_blocks?: ChatStudyBlock[];
  conflicts?: ChatConflictWindow[];
}

interface MateChatProps {
  assessments: Assessment[];
}

const QUICK_PROMPTS = [
  "Help me plan my week",
  "Any deadline conflicts?",
  "What's due soon?",
];

const UNSAFE_PROMPT_PATTERNS = [
  /\bself-harm\b/i,
  /\bsuicide\b/i,
  /\bkill myself\b/i,
  /\bhow to die\b/i,
  /\bexplosive(s)?\b/i,
  /\bbomb\b/i,
  /\bweapon(s)?\b/i,
  /\bhack(ing)?\b/i,
  /\bmalware\b/i,
  /\bphishing\b/i,
];

const PROMPT_INJECTION_PATTERNS = [
  /\bignore (all|any|previous|prior) instructions\b/i,
  /\b(system|developer) prompt\b/i,
  /\bdeveloper message\b/i,
  /\bjailbreak\b/i,
  /\bprompt injection\b/i,
  /\breveal (the )?(prompt|instructions)\b/i,
  /\bbypass (the )?rules\b/i,
];

const JSON_LEAK_KEYS = [
  "ready_to_schedule",
  "availability",
  "intent",
  "assessment_count",
  "course_count",
  "study_blocks",
  "conflicts",
];

function chatStorageKey(userId: string) {
  return `mate-chat-${userId}`;
}

function assessmentStorageKey(userId: string) {
  return `mate-chat-assessments-${userId}`;
}

function buildWelcomeMessage(hasAssessments: boolean): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: hasAssessments
      ? "Hey! I'm Mate. Ask me to plan your week, check for deadline conflicts, or sort out what's coming up — plain language is fine."
      : 'Hey! I\'m Mate. Upload and approve a syllabus first, then come back and say something like "help me plan my week."',
  };
}

function loadChatHistory(userId: string): ChatMessage[] | null {
  try {
    const raw = localStorage.getItem(chatStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function saveChatHistory(userId: string, messages: ChatMessage[]) {
  try {
    localStorage.setItem(chatStorageKey(userId), JSON.stringify(messages));
  } catch {
    // Ignore storage quota / private mode errors
  }
}

function clearChatHistory(userId: string) {
  try {
    localStorage.removeItem(chatStorageKey(userId));
  } catch {
    // Ignore storage quota / private mode errors
  }
}

function buildAssessmentSignature(assessments: Assessment[]) {
  return assessments
    .map((assessment) => `${assessment.id}:${assessment.due_at ?? ""}`)
    .sort()
    .join("|");
}

function isUnsafePrompt(text: string) {
  return (
    UNSAFE_PROMPT_PATTERNS.some((pattern) => pattern.test(text)) ||
    PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(text))
  );
}

function buildGuardrailMessage(): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content:
      "I can only help with deadlines, conflicts, and study plans. Ask about what's due, conflicts, or your weekly schedule.",
  };
}

function extractReplyFromJsonLike(content: string): string | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{") || !trimmed.includes("\"reply\"")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as { reply?: string };
    if (parsed.reply && typeof parsed.reply === "string") {
      return parsed.reply;
    }
  } catch {
    // Fall back to a tolerant string scan below.
  }

  const keyIndex = trimmed.indexOf("\"reply\"");
  if (keyIndex === -1) return null;
  const colonIndex = trimmed.indexOf(":", keyIndex);
  if (colonIndex === -1) return null;

  const firstQuote = trimmed.indexOf("\"", colonIndex + 1);
  if (firstQuote === -1) return null;

  let i = firstQuote + 1;
  let result = "";
  let escaping = false;

  while (i < trimmed.length) {
    const char = trimmed[i];
    if (escaping) {
      result += char;
      escaping = false;
    } else if (char === "\\") {
      escaping = true;
    } else if (char === "\"") {
      return result;
    } else {
      result += char;
    }
    i += 1;
  }

  return null;
}

function sanitizeAssistantMessage(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return content;

  const extractedReply = extractReplyFromJsonLike(trimmed);
  if (extractedReply) {
    return extractedReply;
  }

  const looksJson = trimmed.startsWith("{") && trimmed.endsWith("}");
  const keyHit = JSON_LEAK_KEYS.some(
    (key) => trimmed.includes(`"${key}"`) || trimmed.includes(`${key}:`)
  );

  if (looksJson && keyHit) {
    return "I can help with scheduling and conflicts. Tell me your availability (for example: Mon 2-5pm) or ask what is due soon.";
  }

  if (keyHit && /\bready_to_schedule\b|\bavailability\b/i.test(trimmed)) {
    return "I can help with scheduling. Share your available times and I will build a study plan.";
  }

  return content;
}

export default function MateChat({ assessments }: MateChatProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [messages, setMessages] = useState<ChatMessage[]>([
    buildWelcomeMessage(assessments.length > 0),
  ]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Restore chat history for this Microsoft account (survives logout on same browser)
  useEffect(() => {
    if (!userId) return;

    const saved = loadChatHistory(userId);
    if (saved) {
      setMessages(saved);
    } else {
      setMessages([buildWelcomeMessage(assessments.length > 0)]);
    }
    setHydrated(true);
  }, [userId, assessments.length]);

  useEffect(() => {
    if (!userId) return;

    const signature = buildAssessmentSignature(assessments);
    const key = assessmentStorageKey(userId);
    const lastSignature = localStorage.getItem(key);

    if (lastSignature && lastSignature !== signature) {
      clearChatHistory(userId);
      setMessages([buildWelcomeMessage(assessments.length > 0)]);
    }

    localStorage.setItem(key, signature);
  }, [userId, assessments]);

  // Persist chat after hydration
  useEffect(() => {
    if (!userId || !hydrated) return;
    saveChatHistory(userId, messages);
  }, [userId, messages, hydrated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const getAssessmentTitle = (id: string) =>
    assessments.find((a) => a.id === id)?.title ?? "Study block";

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    if (isUnsafePrompt(trimmed)) {
      setError(
        "Sorry, I can't help with that request. Ask me about deadlines, conflicts, or study plans."
      );
      setInput("");
      setMessages((prev) => [...prev, buildGuardrailMessage()]);
      return;
    }

    setError(null);
    setIsSending(true);
    setInput("");

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);

    const history: ChatTurn[] = [...messages, userMessage]
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to send message");
      }

      const data = await response.json();
      const payload = data.data;
      const safeMessage = sanitizeAssistantMessage(String(payload.message || ""));

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: safeMessage,
        study_blocks: payload.study_blocks,
        conflicts: payload.conflicts,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleClearChat = () => {
    if (!userId) return;
    clearChatHistory(userId);
    setMessages([buildWelcomeMessage(assessments.length > 0)]);
    setError(null);
    setInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Conversation panel */}
      <div className="flex h-full flex-col overflow-hidden bg-surface">
        {/* Messages */}
        <div
          className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4 sm:p-6"
          aria-live="polite"
          aria-label="Conversation with Mate"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] space-y-3 ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-3 text-base leading-relaxed ${
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "border border-border bg-surface-emphasis text-text"
                  }`}
                >
                  {message.role === "assistant" && (
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                      Mate
                    </p>
                  )}
                  {message.role === "assistant" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <p className="whitespace-pre-wrap break-words text-text">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc space-y-1 pl-5 text-text">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal space-y-1 pl-5 text-text">{children}</ol>
                        ),
                        li: ({ children }) => <li className="break-words text-text">{children}</li>,
                        a: ({ children, href }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all text-primary underline underline-offset-2"
                          >
                            {children}
                          </a>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-text">{children}</strong>
                        ),
                        code: ({ children }) => (
                          <code className="whitespace-pre-wrap break-words rounded bg-surface-emphasis px-1 py-0.5 font-mono text-xs text-text">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="max-w-full overflow-x-hidden whitespace-pre-wrap break-words rounded bg-surface-emphasis p-2 text-sm text-text">
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {sanitizeAssistantMessage(message.content)}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  )}
                </div>

                {/* Inline conflict callout — DSD §4 */}
                {message.conflicts && message.conflicts.length > 0 && (
                  <div className="space-y-3">
                    {message.conflicts.map((conflict, index) => (
                      <div
                        key={`${conflict.start_date}-${index}`}
                        className="rounded-lg border border-warning/40 bg-surface-emphasis p-4"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-warning" aria-hidden="true">
                            ⚠
                          </span>
                          <h4 className="text-sm font-semibold text-text">
                            Conflict week:{" "}
                            {new Date(conflict.start_date).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                            })}
                            {" – "}
                            {new Date(conflict.end_date).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                            })}
                          </h4>
                        </div>
                        <ul className="mb-2 space-y-1 text-sm text-text-muted">
                          {conflict.assessment_ids.map((id) => (
                            <li key={id}>• {getAssessmentTitle(id)}</li>
                          ))}
                        </ul>
                        {conflict.intervention && (
                          <p className="text-sm text-text">{conflict.intervention}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline study blocks */}
                {message.study_blocks && message.study_blocks.length > 0 && (
                  <div className="space-y-2">
                    {message.study_blocks.map((block, index) => (
                      <div
                        key={`${block.start_at}-${index}`}
                        className="rounded-lg border border-border bg-surface p-4 shadow-sm"
                      >
                        <p className="font-medium text-text">
                          {block.description || getAssessmentTitle(block.assessment_id)}
                        </p>
                        <p className="mt-1 text-sm text-text-muted">
                          {formatDateTime(block.start_at)} – {formatDateTime(block.end_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator — DSD §5 latency mask */}
          {isSending && (
            <div className="flex justify-start">
              <div
                className="rounded-lg border border-border bg-surface-emphasis px-4 py-3"
                aria-label="Mate is typing"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                  Mate
                </p>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary/60" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary/60 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary/60 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts */}
        <div className="border-t border-border bg-surface px-4 py-3 sm:px-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Try asking
            </p>
            <button
              type="button"
              onClick={handleClearChat}
              className="text-xs font-medium text-text-muted underline underline-offset-2 hover:text-text"
            >
              Clear chat (dev)
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={isSending}
                className="
                  min-h-[36px] rounded-lg border border-primary px-3 py-2 text-sm font-medium
                  text-primary transition-all duration-150 hover:bg-surface-emphasis
                  disabled:cursor-not-allowed disabled:opacity-40
                "
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-border bg-surface p-3 sm:p-4"
        >
          {error && (
            <p className="mb-3 text-sm text-error" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <label htmlFor="mate-chat-input" className="sr-only">
              Message Mate
            </label>
            <textarea
              id="mate-chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='e.g. "Help me plan my week"'
              rows={1}
              disabled={isSending}
              className="
                min-h-[40px] flex-1 resize-none rounded-lg border border-border
                px-3 py-2 text-sm text-text placeholder:text-text-muted
                transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary
                disabled:opacity-60
              "
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              aria-label="Send message to Mate"
              className="
                inline-flex min-h-[40px] min-w-[40px] items-center justify-center
                rounded-lg bg-primary px-3 py-2 font-medium text-white
                transition-all duration-150 hover:bg-primary-hover
                disabled:cursor-not-allowed disabled:opacity-40
              "
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-xs text-text-muted">
            Press Enter to send · Shift+Enter for a new line
          </p>
        </form>
      </div>
    </div>
  );
}
