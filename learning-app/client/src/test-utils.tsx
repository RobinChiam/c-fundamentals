import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { WorkspaceProvider } from "./workspace/WorkspaceProvider";

interface RenderWithRouterOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
  path?: string;
}

export function renderWithRouter(
  ui: ReactElement,
  { route = "/", path = "*", ...options }: RenderWithRouterOptions = {},
) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <WorkspaceProvider>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </WorkspaceProvider>
    </MemoryRouter>,
    options,
  );
}
