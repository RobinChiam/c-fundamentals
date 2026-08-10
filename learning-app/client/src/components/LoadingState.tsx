export function LoadingState({ message }: { message: string }) {
  return (
    <p className="text-slate-600" role="status" aria-live="polite">
      {message}
    </p>
  );
}
