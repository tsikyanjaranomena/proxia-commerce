import { Minus, Plus } from 'lucide-react';

export function QtyStepper({ value, onChange, min = 1, max = 99, size = 'md' }) {
  const btn = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white">
      <button className={`${btn} grid place-items-center rounded-full text-slate-700 transition hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30`} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Diminuer">
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center font-bold tabular-nums">{value}</span>
      <button className={`${btn} grid place-items-center rounded-full text-slate-700 transition hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30`} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Augmenter">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
