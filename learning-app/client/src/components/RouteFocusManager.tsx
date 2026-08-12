import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

export function RouteFocusManager() {
  const location = useLocation();
  const previousPath = useRef(location.pathname);

  useEffect(() => {
    if (previousPath.current === location.pathname) {
      return;
    }
    previousPath.current = location.pathname;

    const main = document.getElementById("main-content");
    if (!main) {
      return;
    }

    const heading = main.querySelector("h1");
    if (heading instanceof HTMLElement) {
      if (!heading.hasAttribute("tabindex")) {
        heading.tabIndex = -1;
      }
      heading.focus();
      return;
    }

    if (!main.hasAttribute("tabindex")) {
      main.tabIndex = -1;
    }
    main.focus();
  }, [location.pathname]);

  return null;
}
