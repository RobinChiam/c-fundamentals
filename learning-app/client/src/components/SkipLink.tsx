export function SkipLink() {
  return (
    <a
      href="#main-content"
      onClick={(event) => {
        event.preventDefault();
        const main = document.getElementById("main-content");
        if (!main) {
          return;
        }
        if (!main.hasAttribute("tabindex")) {
          main.tabIndex = -1;
        }
        main.focus();
      }}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
    >
      Skip to main content
    </a>
  );
}
