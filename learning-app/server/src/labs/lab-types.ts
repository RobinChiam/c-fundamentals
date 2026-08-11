export interface LabStarterFileDefinition {
  id: string;
  name: string;
  content: string;
}

export interface LabTestDefinition {
  id: string;
  title: string;
  visibility: "public" | "hidden";
}

export interface LabHintDefinition {
  index: number;
  content: string;
}

export interface LabEvaluationSpec {
  submissionFileId: string;
  harnessFileName: string;
  buildHarness: (protocolToken: string) => string;
}

export interface LabDefinition {
  id: string;
  lessonId: string;
  exerciseNumber: number;
  title: string;
  revision: number;
  prompt: string;
  concepts: string[];
  starterFiles: LabStarterFileDefinition[];
  publicTests: LabTestDefinition[];
  hiddenTests: LabTestDefinition[];
  hints: LabHintDefinition[];
  evaluation: LabEvaluationSpec;
  solutionFileId: string;
}
