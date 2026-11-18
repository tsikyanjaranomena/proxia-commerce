export const inputCls = (error) =>
  `w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none transition focus:ring-4 ${
    error ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
  }`;
