import {
  ReviewMessage,
  ReviewSeverity,
  ReviewStatus,
  ReviewStore,
  ReviewThread,
  ThreadTargetRef,
} from "./review-types.js";

export interface CreateThreadInput {
  id: string;
  title?: string;
  status?: ReviewStatus;
  severity?: ReviewSeverity;
  motivation?:
    | "note"
    | "question"
    | "change-request"
    | "issue"
    | "approval"
    | "blocking";
  category?: string;
  taxonomy?: string[];
  target: ThreadTargetRef;
  body: string;
  authorId: string;
  suggestedOps?: ReviewThread["suggestedOps"];
  createdAt?: string;
}

export function createThread(
  store: ReviewStore,
  input: CreateThreadInput,
): ReviewStore {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const message: ReviewMessage = {
    messageId: `${input.id}:m1`,
    authorId: input.authorId,
    body: input.body,
    createdAt,
    kind: "comment",
  };

  const thread: ReviewThread = {
    id: input.id,
    status: input.status ?? "open",
    severity: input.severity ?? "should",
    motivation: input.motivation ?? "change-request",
    category: input.category ?? "general",
    target: input.target,
    messages: [message],
    createdAt,
    updatedAt: createdAt,
  };

  if (input.title) {
    thread.title = input.title;
  }

  if (input.taxonomy && input.taxonomy.length > 0) {
    thread.taxonomy = input.taxonomy;
  }

  if (input.suggestedOps && input.suggestedOps.length > 0) {
    thread.suggestedOps = input.suggestedOps;
  }

  return {
    ...store,
    threads: [...store.threads, thread],
  };
}

export function addMessage(
  store: ReviewStore,
  threadId: string,
  body: string,
  authorId: string,
  kind: ReviewMessage["kind"] = "comment",
  createdAt = new Date().toISOString(),
): ReviewStore {
  return {
    ...store,
    threads: store.threads.map((thread) => {
      if (thread.id !== threadId) {
        return thread;
      }

      const nextMessageId = `${threadId}:m${thread.messages.length + 1}`;
      return {
        ...thread,
        messages: [
          ...thread.messages,
          {
            messageId: nextMessageId,
            authorId,
            body,
            createdAt,
            kind,
          },
        ],
        updatedAt: createdAt,
      };
    }),
  };
}

export function setThreadStatus(
  store: ReviewStore,
  threadId: string,
  status: ReviewStatus,
  resolutionNote?: string,
  updatedAt = new Date().toISOString(),
): ReviewStore {
  return {
    ...store,
    threads: store.threads.map((thread) => {
      if (thread.id !== threadId) {
        return thread;
      }

      const nextThread: ReviewThread = {
        ...thread,
        status,
        updatedAt,
      };

      if (resolutionNote) {
        nextThread.resolutionNote = resolutionNote;
      }

      return nextThread;
    }),
  };
}

export function markOrphaned(
  store: ReviewStore,
  threadId: string,
  orphaned = true,
  updatedAt = new Date().toISOString(),
): ReviewStore {
  return {
    ...store,
    threads: store.threads.map((thread) =>
      thread.id === threadId
        ? {
            ...thread,
            orphaned,
            updatedAt,
          }
        : thread,
    ),
  };
}

export function getOpenThreads(store: ReviewStore): ReviewThread[] {
  return store.threads.filter((thread) =>
    thread.status === "open" ||
    thread.status === "accepted" ||
    thread.status === "in-progress",
  );
}

const severityRank: Record<ReviewSeverity, number> = {
  must: 0,
  should: 1,
  could: 2,
  question: 3,
};

export function sortThreads(threads: ReviewThread[]): ReviewThread[] {
  return [...threads].sort((a, b) => {
    const severityDelta = severityRank[a.severity] - severityRank[b.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}
