import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function Sheet({ open, onClose, title, children, footer }) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && closeRef.current?.();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center sm:items-center sm:p-4">
      <div className="animate-fade absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={() => onClose?.()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl sm:max-w-lg sm:rounded-[2rem]"
      >
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden" />
        {title && (
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-3">
            <h2 className="font-display text-xl font-semibold">{title}</h2>
            {onClose && (
              <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95" aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="shrink-0 border-t border-slate-100 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}
