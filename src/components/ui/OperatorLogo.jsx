export function OperatorLogo({ op, className = 'h-10 w-10 text-xs' }) {
  return <span className={`grid shrink-0 place-items-center rounded-xl font-extrabold ${op.badge} ${className}`}>{op.logo}</span>;
}
