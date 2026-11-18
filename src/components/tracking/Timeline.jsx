import { CircleCheck } from 'lucide-react';

export function Timeline({ steps, current }) {
  const idx = steps.findIndex((s) => s.id === current);
  return (
    <ol className="flex items-start">
      {steps.map((s, i) => {
        const done = i <= idx;
        return (
          <li key={s.id} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && <span className={`absolute right-1/2 top-3.5 h-0.5 w-full ${i <= idx ? 'bg-emerald-600' : 'bg-slate-200'}`} />}
            <span className={`relative z-10 grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'} ${i === idx && current !== 'delivered' ? 'ring-4 ring-emerald-100' : ''}`}>
              {done ? <CircleCheck className="h-4 w-4" /> : i + 1}
            </span>
            <span className={`mt-1.5 text-[10px] font-semibold leading-tight sm:text-xs ${done ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
