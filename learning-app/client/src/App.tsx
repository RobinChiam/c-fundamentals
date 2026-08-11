import { BrowserRouter, Route, Routes } from "react-router";
import { AppShell } from "./components/AppShell";
import { CurriculumPage } from "./pages/CurriculumPage";
import { LabPage } from "./pages/LabPage";
import { LessonPage } from "./pages/LessonPage";
import { ControlFlowVisualizerPage } from "./pages/ControlFlowVisualizerPage";
import { DynamicMemoryVisualizerPage } from "./pages/DynamicMemoryVisualizerPage";
import { FunctionCallVisualizerPage } from "./pages/FunctionCallVisualizerPage";
import { PointerVisualizerPage } from "./pages/PointerVisualizerPage";
import { SearchingSortingVisualizerPage } from "./pages/SearchingSortingVisualizerPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { WorkspaceProvider } from "./workspace/WorkspaceProvider";

export function App() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<CurriculumPage />} />
            <Route path="lessons/:lessonId" element={<LessonPage />} />
            <Route
              path="lessons/:lessonId/labs/:labId"
              element={<LabPage />}
            />
            <Route
              path="lessons/searching-and-sorting/visualize"
              element={<SearchingSortingVisualizerPage />}
            />
            <Route
              path="lessons/functions-and-scope/visualize"
              element={<FunctionCallVisualizerPage />}
            />
            <Route
              path="lessons/pointers/visualize"
              element={<PointerVisualizerPage />}
            />
            <Route
              path="lessons/dynamic-memory-allocation/visualize"
              element={<DynamicMemoryVisualizerPage />}
            />
            <Route
              path="lessons/loops-and-input-validation/visualize"
              element={<ControlFlowVisualizerPage />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </WorkspaceProvider>
    </BrowserRouter>
  );
}
