export class PersistenceInitializationError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PersistenceInitializationError";
  }
}

export class UnsupportedMigrationVersionError extends Error {
  readonly appliedVersion: number;
  readonly knownVersion: number;

  constructor(appliedVersion: number, knownVersion: number) {
    super(
      `Database schema version ${appliedVersion} is newer than application supports (${knownVersion})`,
    );
    this.name = "UnsupportedMigrationVersionError";
    this.appliedVersion = appliedVersion;
    this.knownVersion = knownVersion;
  }
}

export class PersistenceUnavailableError extends Error {
  constructor(message = "Persistence is unavailable") {
    super(message);
    this.name = "PersistenceUnavailableError";
  }
}

export class DraftPayloadTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DraftPayloadTooLargeError";
  }
}

export class NonEditableFileError extends Error {
  constructor(lessonId: string, fileId: string) {
    super(`File is not editable for draft persistence: ${lessonId}/${fileId}`);
    this.name = "NonEditableFileError";
  }
}
