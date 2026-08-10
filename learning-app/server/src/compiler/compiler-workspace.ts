import type { CompileRequest } from "@learning-app/shared";
import type { ManifestLessonEntry } from "../curriculum/manifest.js";
import {
  InvalidWorkspaceError,
  PayloadTooLargeError,
} from "./compiler-errors.js";
import {
  MAX_FILE_BYTES,
  MAX_TOTAL_SOURCE_BYTES,
  MAX_WORKSPACE_FILES,
} from "./compiler-limits.js";

const EDITABLE_ROLES = new Set(["primary", "support", "header"]);
const FORBIDDEN_ROLES = new Set(["readme", "solution"]);

export interface ValidatedWorkspaceFile {
  id: string;
  name: string;
  content: string;
}

function byteLength(content: string): number {
  return Buffer.byteLength(content, "utf8");
}

export function validateCompileRequest(
  lesson: ManifestLessonEntry,
  request: CompileRequest,
): ValidatedWorkspaceFile[] {
  if (request.files.length > MAX_WORKSPACE_FILES) {
    throw new PayloadTooLargeError(
      `Compile request exceeds maximum file count of ${MAX_WORKSPACE_FILES}`,
    );
  }

  const expectedEditableFiles = lesson.files.filter((file) =>
    EDITABLE_ROLES.has(file.role),
  );
  const expectedIds = new Set(expectedEditableFiles.map((file) => file.id));
  const manifestById = new Map(lesson.files.map((file) => [file.id, file]));
  const seenIds = new Set<string>();
  let totalBytes = 0;
  const validated: ValidatedWorkspaceFile[] = [];

  for (const file of request.files) {
    if (seenIds.has(file.id)) {
      throw new InvalidWorkspaceError(`Duplicate file id in compile request: ${file.id}`);
    }
    seenIds.add(file.id);

    const manifestFile = manifestById.get(file.id);
    if (!manifestFile) {
      throw new InvalidWorkspaceError(`Unknown file id in compile request: ${file.id}`);
    }

    if (FORBIDDEN_ROLES.has(manifestFile.role)) {
      throw new InvalidWorkspaceError(
        `File role ${manifestFile.role} is not allowed in compile request: ${file.id}`,
      );
    }

    if (!EDITABLE_ROLES.has(manifestFile.role)) {
      throw new InvalidWorkspaceError(
        `File role ${manifestFile.role} is not editable: ${file.id}`,
      );
    }

    const fileBytes = byteLength(file.content);
    if (fileBytes > MAX_FILE_BYTES) {
      throw new PayloadTooLargeError(
        `File ${file.id} exceeds maximum size of ${MAX_FILE_BYTES} bytes`,
      );
    }

    totalBytes += fileBytes;
    if (totalBytes > MAX_TOTAL_SOURCE_BYTES) {
      throw new PayloadTooLargeError(
        `Compile request exceeds maximum total source size of ${MAX_TOTAL_SOURCE_BYTES} bytes`,
      );
    }

    validated.push({
      id: manifestFile.id,
      name: manifestFile.name,
      content: file.content,
    });
  }

  for (const expectedId of expectedIds) {
    if (!seenIds.has(expectedId)) {
      throw new InvalidWorkspaceError(
        `Compile request is missing expected file: ${expectedId}`,
      );
    }
  }

  return validated;
}

export function buildFileNameToIdMap(
  lesson: ManifestLessonEntry,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const file of lesson.files) {
    map.set(file.name, file.id);
  }
  return map;
}
