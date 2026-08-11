import { useMemo, useState } from "react";
import type { LessonArchitectureResponse } from "@learning-app/shared";
import { ArchitectureNotice } from "./ArchitectureNotice";
import { ArchitectureNodeDetails } from "./ArchitectureNodeDetails";
import { ArchitectureSourceViewer } from "./ArchitectureSourceViewer";
import { BuildMistakes } from "./BuildMistakes";
import { BuildPipeline } from "./BuildPipeline";
import { DataOwnershipPanel } from "./DataOwnershipPanel";
import { FileDependencyGraph } from "./FileDependencyGraph";
import { PublicApiPanel } from "./PublicApiPanel";
import { TranslationUnitsPanel } from "./TranslationUnitsPanel";
import { WorkflowExplorer } from "./WorkflowExplorer";

interface ArchitectureExplorerProps {
  architecture: LessonArchitectureResponse;
}

type Lesson12Tab =
  | "relationships"
  | "translation-units"
  | "build-pipeline"
  | "public-contract"
  | "build-mistakes";

type CapstoneTab =
  | "overview"
  | "dependencies"
  | "public-apis"
  | "ownership"
  | "build-pipeline"
  | "workflows";

export function ArchitectureExplorer({ architecture }: ArchitectureExplorerProps) {
  const [lesson12Tab, setLesson12Tab] = useState<Lesson12Tab>("relationships");
  const [capstoneTab, setCapstoneTab] = useState<CapstoneTab>("overview");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(
    architecture.files[0]?.fileId ?? null,
  );

  const selectedFile = useMemo(
    () => architecture.files.find((file) => file.fileId === selectedFileId) ?? null,
    [architecture.files, selectedFileId],
  );

  const viewableFileId =
    selectedFile && selectedFile.kind !== "resource" ? selectedFile.fileId : null;

  if (architecture.isCapstone) {
    return (
      <div className="space-y-6">
        <ArchitectureNotice />

        <div
          role="tablist"
          aria-label="Capstone architecture sections"
          className="flex flex-wrap gap-2"
        >
          {(
            [
              ["overview", "Overview"],
              ["dependencies", "Files & Dependencies"],
              ["public-apis", "Public APIs"],
              ["ownership", "Data Ownership"],
              ["build-pipeline", "Build Pipeline"],
              ["workflows", "Runtime Workflows"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={capstoneTab === id}
              onClick={() => setCapstoneTab(id)}
              className={`rounded-md border px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                capstoneTab === id
                  ? "border-blue-600 bg-blue-50 text-blue-900"
                  : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {capstoneTab === "overview" ? (
          <section className="space-y-4">
            <p className="text-sm text-slate-700">
              The capstone combines structures, dynamic memory, searching/sorting,
              and file I/O across coordinated modules.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {architecture.modules.map((module) => (
                <li
                  key={module.id}
                  className="rounded-md border border-slate-200 bg-white p-4 text-sm"
                >
                  <h3 className="font-semibold text-slate-900">{module.label}</h3>
                  <p className="mt-1 text-slate-700">{module.responsibility}</p>
                </li>
              ))}
            </ul>
            {architecture.resources.length > 0 ? (
              <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Persistence resources
                </h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-700">
                  {architecture.resources.map((resource) => (
                    <li key={resource.id}>
                      <span className="font-medium">{resource.label}</span>
                      {" — "}
                      {resource.description}
                      {resource.format ? (
                        <>
                          {" "}
                          Format:{" "}
                          <span className="font-mono">{resource.format}</span>
                        </>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <p className="text-sm text-slate-600">{architecture.solutionOmittedNote}</p>
          </section>
        ) : null}

        {capstoneTab === "dependencies" ? (
          <section className="space-y-4">
            <FileDependencyGraph
              files={architecture.files}
              includes={architecture.includes}
              modules={architecture.modules}
              selectedFileId={selectedFileId}
              onSelectFile={setSelectedFileId}
            />
            <ArchitectureNodeDetails
              file={selectedFile}
              includeGuards={architecture.includeGuards}
            />
            <ArchitectureSourceViewer
              lessonId={architecture.lessonId}
              fileId={viewableFileId}
              fileName={selectedFile?.name ?? null}
            />
          </section>
        ) : null}

        {capstoneTab === "public-apis" ? (
          <PublicApiPanel modules={architecture.modules} />
        ) : null}

        {capstoneTab === "ownership" ? (
          <DataOwnershipPanel ownership={architecture.ownership} />
        ) : null}

        {capstoneTab === "build-pipeline" ? (
          <BuildPipeline
            build={architecture.build}
            stages={architecture.buildPipelineStages}
          />
        ) : null}

        {capstoneTab === "workflows" ? (
          <WorkflowExplorer workflows={architecture.workflows} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ArchitectureNotice />

      <div
        role="tablist"
        aria-label="Architecture sections"
        className="flex flex-wrap gap-2"
      >
        {(
          [
            ["relationships", "File Relationships"],
            ["translation-units", "Translation Units"],
            ["build-pipeline", "Build Pipeline"],
            ["public-contract", "Public Contract"],
            ["build-mistakes", "Common Build Mistakes"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={lesson12Tab === id}
            onClick={() => setLesson12Tab(id)}
            className={`rounded-md border px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              lesson12Tab === id
                ? "border-blue-600 bg-blue-50 text-blue-900"
                : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {lesson12Tab === "relationships" ? (
        <section className="space-y-4">
          <FileDependencyGraph
            files={architecture.files}
            includes={architecture.includes}
            modules={architecture.modules}
            selectedFileId={selectedFileId}
            onSelectFile={setSelectedFileId}
          />
          <ArchitectureNodeDetails
            file={selectedFile}
            includeGuards={architecture.includeGuards}
          />
          <ArchitectureSourceViewer
            lessonId={architecture.lessonId}
            fileId={viewableFileId}
            fileName={selectedFile?.name ?? null}
          />
          <p className="text-sm text-slate-600">{architecture.solutionOmittedNote}</p>
        </section>
      ) : null}

      {lesson12Tab === "translation-units" ? (
        <TranslationUnitsPanel
          translationUnits={architecture.build.translationUnits}
        />
      ) : null}

      {lesson12Tab === "build-pipeline" ? (
        <BuildPipeline
          build={architecture.build}
          stages={architecture.buildPipelineStages}
        />
      ) : null}

      {lesson12Tab === "public-contract" ? (
        <PublicApiPanel modules={architecture.modules} />
      ) : null}

      {lesson12Tab === "build-mistakes" && architecture.buildMistakes ? (
        <BuildMistakes mistakes={architecture.buildMistakes} />
      ) : null}
    </div>
  );
}
