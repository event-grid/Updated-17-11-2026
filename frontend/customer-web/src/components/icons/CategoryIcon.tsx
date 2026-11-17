/** Simple line icons for event categories (24x24 grid, drawn with currentColor). */

export type CategoryIconName =
  | "rings"
  | "people"
  | "cake"
  | "camera"
  | "cloche"
  | "pram"
  | "clipboard"
  | "venue"
  | "gift"
  | "briefcase"
  | "cap"
  | "tent"
  | "sparkle";

const PATHS: Record<CategoryIconName, React.ReactNode> = {
  rings: (
    <>
      <circle cx="9" cy="14" r="5.5" />
      <circle cx="15" cy="14" r="5.5" />
      <path d="M7.5 6.5 9 4.5l1.5 2L9 8.5z" />
    </>
  ),
  people: (
    <>
      <circle cx="12" cy="7" r="2.6" />
      <path d="M7 19c0-3.2 2.2-5.5 5-5.5s5 2.3 5 5.5" />
      <circle cx="5.5" cy="9" r="2" />
      <path d="M2 18c0-2.4 1.5-4.2 3.5-4.2" />
      <circle cx="18.5" cy="9" r="2" />
      <path d="M22 18c0-2.4-1.5-4.2-3.5-4.2" />
    </>
  ),
  cake: (
    <>
      <path d="M4 20h16v-6.5a1.5 1.5 0 0 0-1.5-1.5h-13A1.5 1.5 0 0 0 4 13.5z" />
      <path d="M4 15.5c1.3 1 2.7 1 4 0s2.7-1 4 0 2.7 1 4 0 2.7-1 4 0" />
      <path d="M8 12V9m4 3V8.5m4 3.5V9" />
      <path d="M12 5.5c.8-.6.8-1.6 0-2.5-.8.9-.8 1.9 0 2.5z" />
    </>
  ),
  camera: (
    <>
      <path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h2.5l1.5-2h6l1.5 2H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  cloche: (
    <>
      <path d="M3 17h18M4.5 17a7.5 7.5 0 0 1 15 0" />
      <path d="M12 9.5V8m-1.5 0h3" />
      <path d="M3.5 20h17" />
    </>
  ),
  pram: (
    <>
      <path d="M5 12h14a7 7 0 0 1-14 0z" />
      <path d="M5 12a7 7 0 0 1 7-7v7" />
      <path d="M19 12l2-4" />
      <circle cx="8" cy="20.5" r="1.5" />
      <circle cx="16" cy="20.5" r="1.5" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4.5" width="14" height="17" rx="2" />
      <path d="M9 4.5V3.5h6v1" />
      <path d="m8.5 11 1.5 1.5 2.5-3M8.5 16.5l1.5 1.5 2.5-3M14.5 11h2M14.5 16.5h2" />
    </>
  ),
  venue: (
    <>
      <path d="M3 9.5 12 4l9 5.5z" />
      <path d="M5 9.5v9M9.5 9.5v9M14.5 9.5v9M19 9.5v9" />
      <path d="M3 20.5h18M4 18.5h16" />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="9" width="16" height="11.5" rx="1.5" />
      <path d="M3 9h18v3H3zM12 9v11.5" />
      <path d="M12 9c-1.5-3.5-5-4-5-1.6C7 9 12 9 12 9zm0 0c1.5-3.5 5-4 5-1.6C17 9 12 9 12 9z" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7.5" width="18" height="12.5" rx="2" />
      <path d="M8.5 7.5V6a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 6v1.5" />
      <path d="M3 13h18M11 13v1.5h2V13" />
    </>
  ),
  cap: (
    <>
      <path d="M2 9.5 12 5l10 4.5-10 4.5z" />
      <path d="M6 11.3V16c0 1.4 2.7 2.8 6 2.8s6-1.4 6-2.8v-4.7" />
      <path d="M21 10v5" />
    </>
  ),
  tent: (
    <>
      <path d="M3 20 12 5l9 15z" />
      <path d="M12 5v15M9 20l3-5 3 5" />
      <path d="M2 20h20" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3c.6 4.5 2 6.2 6.5 7-4.5.8-5.9 2.5-6.5 7-.6-4.5-2-6.2-6.5-7 4.5-.8 5.9-2.5 6.5-7z" />
      <path d="M19 15.5c.2 1.4.7 2 2 2.3-1.3.3-1.8.9-2 2.2-.2-1.3-.7-1.9-2-2.2 1.3-.3 1.8-.9 2-2.3z" />
    </>
  ),
};

export function CategoryIcon({ name, className = "" }: { name: CategoryIconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
