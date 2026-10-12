export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <p className="loading-state">{label}</p>;
}

export function ErrorBanner({ message }: { message: string }) {
  return <p className="error-banner">{message}</p>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {hint && <small>{hint}</small>}
    </div>
  );
}
