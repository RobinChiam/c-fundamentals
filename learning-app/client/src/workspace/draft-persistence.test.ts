import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as persistenceApi from "../api/persistence-api";
import { workspaceReducer, createLessonWorkspace } from "./workspace-reducer";
import { initialWorkspaceStoreState } from "./workspace-reducer";
import { DRAFT_AUTOSAVE_DEBOUNCE_MS } from "./draft-persistence-types";
import { useDraftPersistence } from "./use-draft-persistence";

vi.mock("../api/persistence-api");

describe("useDraftPersistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("debounces save calls", async () => {
    vi.mocked(persistenceApi.saveLessonDraft).mockResolvedValue({
      lessonId: "arrays",
      fileId: "primary",
      content: "draft",
      updatedAt: "2026-01-01T00:00:00.000Z",
      stale: false,
    });

    const dispatch = vi.fn();
    const { result } = renderHook(() => useDraftPersistence(dispatch));

    act(() => {
      result.current.scheduleDraftSave(
        "arrays",
        "primary",
        "draft",
        "original",
      );
    });

    expect(persistenceApi.saveLessonDraft).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DRAFT_AUTOSAVE_DEBOUNCE_MS);
    });

    expect(persistenceApi.saveLessonDraft).toHaveBeenCalledWith(
      "arrays",
      "primary",
      "draft",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("latest edit wins over older save lifecycle", async () => {
    let resolveFirst!: (value: Awaited<ReturnType<typeof persistenceApi.saveLessonDraft>>) => void;
    vi.mocked(persistenceApi.saveLessonDraft)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValue({
        lessonId: "arrays",
        fileId: "primary",
        content: "newer",
        updatedAt: "2026-01-01T00:00:00.000Z",
        stale: false,
      });

    const dispatch = vi.fn();
    const { result } = renderHook(() => useDraftPersistence(dispatch));

    act(() => {
      result.current.scheduleDraftSave("arrays", "primary", "older", "original");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(DRAFT_AUTOSAVE_DEBOUNCE_MS);
    });

    act(() => {
      result.current.scheduleDraftSave("arrays", "primary", "newer", "original");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(DRAFT_AUTOSAVE_DEBOUNCE_MS);
    });

    expect(persistenceApi.saveLessonDraft).toHaveBeenLastCalledWith(
      "arrays",
      "primary",
      "newer",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    await act(async () => {
      resolveFirst({
        lessonId: "arrays",
        fileId: "primary",
        content: "older",
        updatedAt: "2026-01-01T00:00:00.000Z",
        stale: false,
      });
    });

    const savedCalls = dispatch.mock.calls.filter(
      ([action]) =>
        action.type === "SET_SAVE_STATUS" && action.saveStatus === "saved",
    );
    expect(savedCalls.length).toBeLessThanOrEqual(1);
  });

  it("deletes draft when content matches original", async () => {
    vi.mocked(persistenceApi.deleteLessonDraft).mockResolvedValue(undefined);
    const dispatch = vi.fn();
    const { result } = renderHook(() => useDraftPersistence(dispatch));

    act(() => {
      result.current.scheduleDraftSave("arrays", "primary", "original", "original");
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DRAFT_AUTOSAVE_DEBOUNCE_MS);
    });

    expect(persistenceApi.deleteLessonDraft).toHaveBeenCalledWith(
      "arrays",
      "primary",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("reset invalidates in-flight save and keeps delete authoritative", async () => {
    let resolveSave!: (
      value: Awaited<ReturnType<typeof persistenceApi.saveLessonDraft>>,
    ) => void;
    vi.mocked(persistenceApi.saveLessonDraft).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    vi.mocked(persistenceApi.deleteLessonDraft).mockResolvedValue(undefined);

    const dispatch = vi.fn();
    const { result } = renderHook(() => useDraftPersistence(dispatch));

    act(() => {
      result.current.scheduleDraftSave("arrays", "primary", "draft", "original");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(DRAFT_AUTOSAVE_DEBOUNCE_MS);
    });

    await act(async () => {
      await result.current.deletePersistedDraft("arrays", "primary");
    });

    expect(persistenceApi.deleteLessonDraft).toHaveBeenCalledWith(
      "arrays",
      "primary",
    );

    await act(async () => {
      resolveSave({
        lessonId: "arrays",
        fileId: "primary",
        content: "draft",
        updatedAt: "2026-01-01T00:00:00.000Z",
        stale: false,
      });
    });

    expect(persistenceApi.deleteLessonDraft).toHaveBeenCalledTimes(2);
    const savedCalls = dispatch.mock.calls.filter(
      ([action]) =>
        action.type === "SET_SAVE_STATUS" && action.saveStatus === "saved",
    );
    expect(savedCalls).toHaveLength(1);
  });

  it("superseded in-flight save does not overwrite a newer edit", async () => {
    let resolveFirst!: (
      value: Awaited<ReturnType<typeof persistenceApi.saveLessonDraft>>,
    ) => void;
    vi.mocked(persistenceApi.saveLessonDraft)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValue({
        lessonId: "arrays",
        fileId: "primary",
        content: "newer",
        updatedAt: "2026-01-01T00:00:00.000Z",
        stale: false,
      });

    const dispatch = vi.fn();
    const { result } = renderHook(() => useDraftPersistence(dispatch));

    act(() => {
      result.current.scheduleDraftSave("arrays", "primary", "older", "original");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(DRAFT_AUTOSAVE_DEBOUNCE_MS);
    });

    act(() => {
      result.current.scheduleDraftSave("arrays", "primary", "newer", "original");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(DRAFT_AUTOSAVE_DEBOUNCE_MS);
    });

    expect(persistenceApi.saveLessonDraft).toHaveBeenLastCalledWith(
      "arrays",
      "primary",
      "newer",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    await act(async () => {
      resolveFirst({
        lessonId: "arrays",
        fileId: "primary",
        content: "older",
        updatedAt: "2026-01-01T00:00:00.000Z",
        stale: false,
      });
    });

    expect(persistenceApi.deleteLessonDraft).not.toHaveBeenCalled();
    expect(persistenceApi.saveLessonDraft).toHaveBeenCalledTimes(2);
  });
});

describe("workspace reducer persistence actions", () => {
  const baseWorkspace = createLessonWorkspace("arrays", [
    {
      id: "primary",
      name: "arrays.c",
      role: "primary",
      language: "c",
      originalContent: "original",
      draftContent: "original",
    },
  ]);

  it("applies stale draft without changing original", () => {
    const readyState = {
      ...initialWorkspaceStoreState,
      lessons: {
        arrays: {
          status: "ready" as const,
          workspace: {
            ...baseWorkspace,
            staleDrafts: [{ fileId: "primary", content: "saved stale" }],
          },
        },
      },
    };

    const next = workspaceReducer(readyState, {
      type: "APPLY_STALE_DRAFT",
      lessonId: "arrays",
      fileId: "primary",
      content: "saved stale",
    });

    const entry = next.lessons.arrays;
    expect(entry?.status).toBe("ready");
    if (entry?.status === "ready") {
      expect(entry.workspace.files[0]?.draftContent).toBe("saved stale");
      expect(entry.workspace.files[0]?.originalContent).toBe("original");
      expect(entry.workspace.staleDrafts).toHaveLength(0);
    }
  });

  it("discards stale draft banner state", () => {
    const readyState = {
      ...initialWorkspaceStoreState,
      lessons: {
        arrays: {
          status: "ready" as const,
          workspace: {
            ...baseWorkspace,
            staleDrafts: [{ fileId: "primary", content: "saved stale" }],
          },
        },
      },
    };

    const next = workspaceReducer(readyState, {
      type: "DISCARD_STALE_DRAFT",
      lessonId: "arrays",
      fileId: "primary",
    });

    const entry = next.lessons.arrays;
    if (entry?.status === "ready") {
      expect(entry.workspace.staleDrafts).toHaveLength(0);
      expect(entry.workspace.files[0]?.draftContent).toBe("original");
    }
  });
});
