import { describe, expect, it } from "vitest";
import {
  createLessonWorkspace,
  initialWorkspaceStoreState,
  workspaceReducer,
} from "./workspace-reducer";
import type { EditableWorkspaceFile } from "./workspace-types";
import { countDirtyFiles, isFileDirty } from "./workspace-selectors";

const fileA: EditableWorkspaceFile = {
  id: "primary",
  name: "main.c",
  role: "primary",
  language: "c",
  originalContent: "original-a",
  draftContent: "original-a",
};

const fileB: EditableWorkspaceFile = {
  id: "support",
  name: "helper.c",
  role: "support",
  language: "c",
  originalContent: "original-b",
  draftContent: "original-b",
};

function createReadyState(lessonId: string) {
  const workspace = createLessonWorkspace(lessonId, [fileA, fileB]);
  return workspaceReducer(initialWorkspaceStoreState, {
    type: "LOAD_SUCCESS",
    lessonId,
    workspace,
  });
}

describe("workspace reducer", () => {
  it("begins with original and draft equal", () => {
    const workspace = createLessonWorkspace("arrays", [fileA]);
    expect(workspace.files[0]?.draftContent).toBe(
      workspace.files[0]?.originalContent,
    );
    expect(isFileDirty(workspace.files[0]!)).toBe(false);
  });

  it("updates draft without changing original", () => {
    const state = createReadyState("arrays");
    const next = workspaceReducer(state, {
      type: "UPDATE_DRAFT",
      lessonId: "arrays",
      fileId: "primary",
      content: "changed",
    });

    const workspace = next.lessons.arrays;
    expect(workspace?.status).toBe("ready");
    if (workspace?.status !== "ready") {
      throw new Error("Expected ready workspace");
    }

    const file = workspace.workspace.files.find((entry) => entry.id === "primary");
    expect(file?.originalContent).toBe("original-a");
    expect(file?.draftContent).toBe("changed");
    expect(isFileDirty(file!)).toBe(true);
  });

  it("derives dirty state correctly", () => {
    const state = workspaceReducer(createReadyState("arrays"), {
      type: "UPDATE_DRAFT",
      lessonId: "arrays",
      fileId: "primary",
      content: "changed",
    });

    const workspace = state.lessons.arrays;
    if (!workspace || workspace.status !== "ready") {
      throw new Error("Expected ready workspace");
    }

    expect(countDirtyFiles(workspace.workspace)).toBe(1);
  });

  it("does not modify another file when one draft changes", () => {
    const state = workspaceReducer(createReadyState("arrays"), {
      type: "UPDATE_DRAFT",
      lessonId: "arrays",
      fileId: "primary",
      content: "changed",
    });

    const workspace = state.lessons.arrays;
    if (!workspace || workspace.status !== "ready") {
      throw new Error("Expected ready workspace");
    }

    const other = workspace.workspace.files.find((entry) => entry.id === "support");
    expect(other?.draftContent).toBe("original-b");
  });

  it("preserves drafts when selecting another file", () => {
    let state = workspaceReducer(createReadyState("arrays"), {
      type: "UPDATE_DRAFT",
      lessonId: "arrays",
      fileId: "primary",
      content: "changed",
    });
    state = workspaceReducer(state, {
      type: "SELECT_FILE",
      lessonId: "arrays",
      fileId: "support",
    });
    state = workspaceReducer(state, {
      type: "SELECT_FILE",
      lessonId: "arrays",
      fileId: "primary",
    });

    const workspace = state.lessons.arrays;
    if (!workspace || workspace.status !== "ready") {
      throw new Error("Expected ready workspace");
    }

    const file = workspace.workspace.files.find((entry) => entry.id === "primary");
    expect(file?.draftContent).toBe("changed");
  });

  it("resets only the selected file", () => {
    let state = createReadyState("arrays");
    state = workspaceReducer(state, {
      type: "UPDATE_DRAFT",
      lessonId: "arrays",
      fileId: "primary",
      content: "changed",
    });
    state = workspaceReducer(state, {
      type: "UPDATE_DRAFT",
      lessonId: "arrays",
      fileId: "support",
      content: "support-changed",
    });
    state = workspaceReducer(state, {
      type: "RESET_FILE",
      lessonId: "arrays",
      fileId: "primary",
    });

    const workspace = state.lessons.arrays;
    if (!workspace || workspace.status !== "ready") {
      throw new Error("Expected ready workspace");
    }

    const primary = workspace.workspace.files.find((entry) => entry.id === "primary");
    const support = workspace.workspace.files.find((entry) => entry.id === "support");
    expect(primary?.draftContent).toBe("original-a");
    expect(support?.draftContent).toBe("support-changed");
  });

  it("resets all files in the workspace", () => {
    let state = createReadyState("arrays");
    state = workspaceReducer(state, {
      type: "UPDATE_DRAFT",
      lessonId: "arrays",
      fileId: "primary",
      content: "changed",
    });
    state = workspaceReducer(state, {
      type: "UPDATE_DRAFT",
      lessonId: "arrays",
      fileId: "support",
      content: "support-changed",
    });
    state = workspaceReducer(state, {
      type: "RESET_WORKSPACE",
      lessonId: "arrays",
    });

    const workspace = state.lessons.arrays;
    if (!workspace || workspace.status !== "ready") {
      throw new Error("Expected ready workspace");
    }

    expect(countDirtyFiles(workspace.workspace)).toBe(0);
  });

  it("keeps separate workspace state per lesson", () => {
    let state = createReadyState("arrays");
    state = workspaceReducer(state, {
      type: "LOAD_SUCCESS",
      lessonId: "pointers",
      workspace: createLessonWorkspace("pointers", [
        {
          ...fileA,
          id: "primary",
          originalContent: "pointer-original",
          draftContent: "pointer-original",
        },
      ]),
    });
    state = workspaceReducer(state, {
      type: "UPDATE_DRAFT",
      lessonId: "arrays",
      fileId: "primary",
      content: "arrays-changed",
    });

    const arrays = state.lessons.arrays;
    const pointers = state.lessons.pointers;
    if (
      !arrays ||
      arrays.status !== "ready" ||
      !pointers ||
      pointers.status !== "ready"
    ) {
      throw new Error("Expected ready workspaces");
    }

    expect(
      arrays.workspace.files.find((file) => file.id === "primary")?.draftContent,
    ).toBe("arrays-changed");
    expect(
      pointers.workspace.files.find((file) => file.id === "primary")?.draftContent,
    ).toBe("pointer-original");
  });

  it("retains drafts when navigating away and back within the store", () => {
    let state = createReadyState("arrays");
    state = workspaceReducer(state, {
      type: "UPDATE_DRAFT",
      lessonId: "arrays",
      fileId: "primary",
      content: "still-here",
    });

    const revisited = state.lessons.arrays;
    if (!revisited || revisited.status !== "ready") {
      throw new Error("Expected ready workspace");
    }

    expect(
      revisited.workspace.files.find((file) => file.id === "primary")?.draftContent,
    ).toBe("still-here");
  });
});
