// Metadata for /about lives in page.tsx (single source of truth).

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
