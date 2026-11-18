import { CircleCheck, TriangleAlert } from 'lucide-react';

export function Toasts({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[1500] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={`animate-push pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold shadow-lg ${
            t.type === 'error' ? 'bg-litchi text-white' : t.type === 'info' ? 'bg-ink text-white' : 'bg-brand text-white'
          }`}
        >
          {t.type === 'error' ? <TriangleAlert className="h-5 w-5 shrink-0" /> : <CircleCheck className="h-5 w-5 shrink-0" />}
          <span>{t.message}</span>
        </button>
      ))}
    </div>
  );
}
