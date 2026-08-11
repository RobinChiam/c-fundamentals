import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  LabsApiNotFoundError,
  LabsApiUnavailableError,
  deleteAllLabDrafts,
  evaluateLab,
  getLab,
  listLabAttempts,
  listLabDrafts,
  revealLabHint,
  revealLabSolution,
} from "../api/labs-api";
import { getRunnerStatus } from "../api/runner-api";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { StaleDraftBanner } from "../components/CodeWorkspace/StaleDraftBanner";
import { MonacoCodeEditor } from "../components/CodeWorkspace/MonacoCodeEditor";
import {
  createInitialLabWorkspaceState,
  type LabWorkspaceState,
} from "../lab/lab-workspace-types";
import { useLabDraftPersistence } from "../lab/use-lab-draft-persistence";

type LabPageState =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "mismatch" }
  | { kind: "error" }
  | { kind: "ready"; workspace: LabWorkspaceState };

export function LabPage() {
  const { lessonId = "", labId = "" } = useParams();
  const [state, setState] = useState<LabPageState>({ kind: "loading" });
  const [retryToken, setRetryToken] = useState(0);

  const updateWorkspace = useCallback(
    (updater: (current: LabWorkspaceState) => LabWorkspaceState) => {
      setState((current) => {
        if (current.kind !== "ready") {
          return current;
        }
        return {
          kind: "ready",
          workspace: updater(current.workspace),
        };
      });
    },
    [],
  );

  const { scheduleDraftSave } = useLabDraftPersistence((saveStatus) => {
    updateWorkspace((workspace) => ({ ...workspace, saveStatus }));
  });

  const loadLab = useCallback(async () => {
    if (!lessonId || !labId) {
      setState({ kind: "not-found" });
      return;
    }

    setState({ kind: "loading" });

    try {
      const [lab, runnerStatus, drafts, attempts] = await Promise.all([
        getLab(labId),
        getRunnerStatus().catch(() => ({ available: false })),
        listLabDrafts(labId).catch(() => null),
        listLabAttempts(labId).catch(() => ({ labId, attempts: [] })),
      ]);

      if (lab.lessonId !== lessonId) {
        setState({ kind: "mismatch" });
        return;
      }

      const workspace = createInitialLabWorkspaceState(lab);
      workspace.runnerUnavailable = !runnerStatus.available;
      workspace.attempts = attempts.attempts;

      const submission = lab.starterFiles[0];
      if (submission && drafts) {
        const saved = drafts.drafts.find((draft) => draft.fileId === submission.id);
        if (saved) {
          if (saved.stale) {
            workspace.staleDraft = saved;
          } else {
            workspace.draftContent = saved.content;
            workspace.dirty = saved.content !== workspace.starterContent;
          }
        }
      }

      setState({ kind: "ready", workspace });
    } catch (error) {
      if (error instanceof LabsApiNotFoundError) {
        setState({ kind: "not-found" });
        return;
      }
      setState({ kind: "error" });
    }
  }, [labId, lessonId]);

  useEffect(() => {
    void loadLab();
  }, [loadLab, retryToken]);

  const workspace = state.kind === "ready" ? state.workspace : null;
  const submissionFile = workspace?.lab.starterFiles[0];

  const saveStatusLabel = useMemo(() => {
    if (!workspace) {
      return "";
    }
    switch (workspace.saveStatus) {
      case "saving":
        return "Saving…";
      case "saved":
        return workspace.dirty ? "Saved" : "Up to date";
      case "save_failed":
        return "Save failed";
      case "persistence_unavailable":
        return "Persistence unavailable";
      default:
        return workspace.dirty ? "Unsaved changes" : "Up to date";
    }
  }, [workspace]);

  const handleRunTests = async () => {
    if (!workspace || !submissionFile) {
      return;
    }

    updateWorkspace((current) => ({
      ...current,
      evaluating: true,
      evaluation: null,
    }));

    try {
      const evaluation = await evaluateLab(workspace.lab.id, {
        files: [{ id: submissionFile.id, content: workspace.draftContent }],
      });
      const attempts = await listLabAttempts(workspace.lab.id).catch(() => ({
        labId: workspace.lab.id,
        attempts: workspace.attempts,
      }));

      updateWorkspace((current) => ({
        ...current,
        evaluating: false,
        evaluation,
        attempts: attempts.attempts,
        lab:
          evaluation.outcome === "passed"
            ? {
                ...current.lab,
                status: "completed",
                progress: {
                  ...current.lab.progress,
                  completedAt: new Date().toISOString(),
                },
              }
            : current.lab,
      }));
    } catch (error) {
      updateWorkspace((current) => ({
        ...current,
        evaluating: false,
        runnerUnavailable: error instanceof LabsApiUnavailableError,
      }));
    }
  };

  const handleRevealHint = async () => {
    if (!workspace) {
      return;
    }
    const nextIndex = workspace.revealedHints.length;
    try {
      const revealed = await revealLabHint(workspace.lab.id, nextIndex);
      updateWorkspace((current) => ({
        ...current,
        revealedHints: [...current.revealedHints, revealed],
        lab: {
          ...current.lab,
          revealedHints: [
            ...current.lab.revealedHints,
            { index: revealed.index, content: revealed.content },
          ],
          progress: {
            ...current.lab.progress,
            hintsRevealed: revealed.hintsRevealed,
          },
        },
      }));
    } catch {
      // Keep UI stable when persistence is unavailable.
    }
  };

  const handleRevealSolution = async () => {
    if (!workspace) {
      return;
    }
    try {
      const solution = await revealLabSolution(workspace.lab.id);
      updateWorkspace((current) => ({
        ...current,
        solutionContent: solution.content,
        solutionConfirmOpen: false,
        lab: {
          ...current.lab,
          solutionRevealed: true,
        },
      }));
    } catch {
      updateWorkspace((current) => ({
        ...current,
        solutionConfirmOpen: false,
      }));
    }
  };

  if (state.kind === "loading") {
    return <LoadingState message="Loading lab…" />;
  }

  if (state.kind === "not-found") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Lab not found</h1>
        <Link to="/" className="text-blue-700 hover:text-blue-900">
          Return to curriculum
        </Link>
      </div>
    );
  }

  if (state.kind === "mismatch") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Lab not available here</h1>
        <p className="text-slate-600">
          This lab does not belong to the requested lesson.
        </p>
        <Link to={`/lessons/${lessonId}`} className="text-blue-700 hover:text-blue-900">
          Back to lesson
        </Link>
      </div>
    );
  }

  if (state.kind === "error" || !workspace || !submissionFile) {
    return (
      <ErrorState
        message="Unable to load lab"
        onRetry={() => setRetryToken((value) => value + 1)}
      />
    );
  }

  return (
    <article>
      <header className="mb-6 border-b border-slate-200 pb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Practice Lab · Exercise {workspace.lab.exerciseNumber}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          {workspace.lab.title}
        </h1>
        <p className="mt-3 text-slate-700">{workspace.lab.prompt}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {workspace.lab.concepts.map((concept) => (
            <span
              key={concept}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {concept}
            </span>
          ))}
        </div>
        <Link
          to={`/lessons/${lessonId}`}
          className="mt-4 inline-flex text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          ← Back to lesson
        </Link>
      </header>

      {workspace.staleDraft ? (
        <StaleDraftBanner
          fileName={submissionFile.name}
          onUse={() => {
            updateWorkspace((current) => ({
              ...current,
              draftContent: current.staleDraft?.content ?? current.draftContent,
              dirty: true,
              staleDraft: null,
            }));
          }}
          onDiscard={async () => {
            await deleteAllLabDrafts(workspace.lab.id).catch(() => {});
            updateWorkspace((current) => ({
              ...current,
              staleDraft: null,
            }));
          }}
        />
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {submissionFile.name}
            </h2>
            <p className="text-xs text-slate-500">{saveStatusLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                updateWorkspace((current) => ({
                  ...current,
                  draftContent: current.starterContent,
                  dirty: false,
                }));
                void deleteAllLabDrafts(workspace.lab.id).catch(() => {});
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Reset Lab
            </button>
            <button
              type="button"
              disabled={workspace.evaluating || workspace.runnerUnavailable}
              onClick={() => {
                void handleRunTests();
              }}
              className="rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {workspace.evaluating ? "Running Tests…" : "Run Tests"}
            </button>
          </div>
        </div>

        {workspace.runnerUnavailable ? (
          <p className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Docker runner is unavailable. You can still edit and save drafts, but
            Run Tests is disabled.
          </p>
        ) : null}

        <MonacoCodeEditor
          value={workspace.draftContent}
          onChange={(value) => {
            const next = value ?? "";
            updateWorkspace((current) => ({
              ...current,
              draftContent: next,
              dirty: next !== current.starterContent,
              saveStatus: "idle",
            }));
            scheduleDraftSave(
              workspace.lab.id,
              submissionFile.id,
              next,
              workspace.starterContent,
            );
          }}
        />
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Tests</h2>
          <ul className="mt-3 space-y-2">
            {[...workspace.lab.publicTests, ...workspace.lab.hiddenTests].map(
              (test) => {
                const result = workspace.evaluation?.testResults.find(
                  (entry) => entry.id === test.id,
                );
                return (
                  <li
                    key={test.id}
                    className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm"
                  >
                    <span>
                      {test.title}
                      {test.visibility === "hidden" ? (
                        <span className="ml-2 text-xs uppercase text-slate-500">
                          hidden
                        </span>
                      ) : null}
                    </span>
                    <span className="font-medium text-slate-700">
                      {result
                        ? result.passed
                          ? "Pass"
                          : "Fail"
                        : "—"}
                    </span>
                  </li>
                );
              },
            )}
          </ul>

          {workspace.evaluation ? (
            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>
                Result: <strong>{workspace.evaluation.outcome}</strong> (
                {workspace.evaluation.passedTests}/{workspace.evaluation.totalTests})
              </p>
              {workspace.evaluation.outcome === "compile_error" ? (
                <ul className="space-y-1 rounded-md bg-red-50 p-3 text-red-800">
                  {workspace.evaluation.compileDiagnostics.map((entry) => (
                    <li key={`${entry.line}:${entry.column}:${entry.message}`}>
                      {entry.fileName}:{entry.line}:{entry.column} {entry.message}
                    </li>
                  ))}
                </ul>
              ) : null}
              {workspace.evaluation.outcome === "timeout" ? (
                <p className="text-amber-800">Evaluation timed out.</p>
              ) : null}
              {workspace.evaluation.outcome === "output_limit" ? (
                <p className="text-amber-800">Output limit exceeded.</p>
              ) : null}
              {!workspace.evaluation.attemptPersisted ? (
                <p className="text-amber-700">
                  Attempt result could not be persisted.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">Hints</h2>
            <ul className="mt-3 space-y-2">
              {workspace.revealedHints.map((hint) => (
                <li
                  key={hint.index}
                  className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  {hint.content}
                </li>
              ))}
            </ul>
            {workspace.revealedHints.length < 4 ? (
              <button
                type="button"
                onClick={() => {
                  void handleRevealHint();
                }}
                className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Reveal Next Hint
              </button>
            ) : null}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Reference Solution
            </h2>
            {workspace.solutionContent ? (
              <MonacoCodeEditor
                value={workspace.solutionContent}
                readOnly
                onChange={() => {}}
              />
            ) : (
              <>
                {workspace.solutionConfirmOpen ? (
                  <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                    <p>
                      This reveals the lesson&apos;s reference solution.c and may
                      contain answers for more than this individual exercise.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void handleRevealSolution();
                        }}
                        className="rounded-md border border-amber-500 bg-amber-500 px-3 py-1.5 text-sm font-medium text-white"
                      >
                        Confirm Reveal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateWorkspace((current) => ({
                            ...current,
                            solutionConfirmOpen: false,
                          }));
                        }}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      updateWorkspace((current) => ({
                        ...current,
                        solutionConfirmOpen: true,
                      }));
                    }}
                    className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Reveal Reference Solution
                  </button>
                )}
              </>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">Attempt History</h2>
            {workspace.attempts.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No attempts yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {workspace.attempts.map((attempt) => (
                  <li
                    key={attempt.id}
                    className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm"
                  >
                    <span>{new Date(attempt.createdAt).toLocaleString()}</span>
                    <span>
                      {attempt.outcome} ({attempt.passedTests}/{attempt.totalTests})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </article>
  );
}
