export class LabNotFoundError extends Error {
  constructor(labId: string) {
    super(`Lab not found: ${labId}`);
    this.name = "LabNotFoundError";
  }
}

export class LabLessonMismatchError extends Error {
  constructor(labId: string, lessonId: string) {
    super(`Lab ${labId} does not belong to lesson ${lessonId}`);
    this.name = "LabLessonMismatchError";
  }
}

export class LabRegistryIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LabRegistryIntegrityError";
  }
}

export class LabIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LabIntegrityError";
  }
}

export class LabStarterFileNotFoundError extends Error {
  constructor(labId: string, fileId: string) {
    super(`Starter file not found for lab ${labId}: ${fileId}`);
    this.name = "LabStarterFileNotFoundError";
  }
}

export class LabHintRevealError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LabHintRevealError";
  }
}

export class LabDraftPayloadTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LabDraftPayloadTooLargeError";
  }
}
