import { Star } from 'lucide-react';

export function Stars({ value, size = 'h-3.5 w-3.5' }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Note ${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${size} ${i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
      ))}
    </span>
  );
}
