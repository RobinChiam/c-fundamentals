import { BrowserRouter, Route, Routes } from "react-router";
import { AppShell } from "./components/AppShell";
import { CurriculumPage } from "./pages/CurriculumPage";
import { LabPage } from "./pages/LabPage";
import { LessonPage } from "./pages/LessonPage";
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
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </WorkspaceProvider>
    </BrowserRouter>
  );
}
