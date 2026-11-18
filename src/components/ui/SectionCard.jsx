export function SectionCard({ title, icon: Icon, children, className = '', action }) {
  return (
    <section className={`ink-card-sm rounded-3xl bg-white p-4 sm:p-5 ${className}`}>
      {title && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-display flex items-center gap-2 text-lg font-semibold">
            {Icon && <Icon className="h-5 w-5 text-brand" />}
            {title}
          </h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
