export default function NavigationSkip() {
  return (
    <a
      role="button"
      href="#main-content"
      tabIndex={0}
      className="not-focus:sr-only focus:fixed focus:top-0 focus:left-0 focus:bg-base-100 focus:text-base-content focus:z-50"
    >
      Skip navigation bar
    </a>
  );
}
