/**
 * Re-mounts on every navigation (unlike the layout), so each page fades in as it arrives.
 * The header, category strip and footer live in the layout and stay still.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 animate-fade-in flex-col">{children}</div>;
}
