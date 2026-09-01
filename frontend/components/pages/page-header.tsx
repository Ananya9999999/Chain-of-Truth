export function PageHeader({
  title,
  description,
  meta,
}: {
  title: string
  description: string
  meta?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground text-pretty">
          {description}
        </p>
      </div>
      {meta && <div className="flex items-center gap-2">{meta}</div>}
    </div>
  )
}
