import { LogIn } from 'lucide-react';

export function LoginPrompt({ title, text, onLogin, compact = false }) {
  return (
    <div className={compact ? 'py-4 text-center' : 'mx-auto max-w-md px-4 py-16 text-center'}>
      {!compact && (
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald-50">
          <LogIn className="h-10 w-10 text-emerald-700" />
        </div>
      )}
      <h2 className={compact ? 'font-bold' : 'mt-4 text-xl font-bold'}>{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
      <button onClick={onLogin} className="mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-emerald-700 px-8 font-bold text-white">
        <LogIn className="h-5 w-5" /> Se connecter
      </button>
    </div>
  );
}
