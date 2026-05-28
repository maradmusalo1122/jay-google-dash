interface Props {
  number: number | string
  label: string
}

export default function StatCard({ number, label }: Props) {
  return (
    <div className="bg-surface border border-line rounded-md px-4 py-3.5">
      <div className="font-display text-3xl text-ink leading-none">{number}</div>
      <div className="text-xs text-ink-3 mt-1">{label}</div>
    </div>
  )
}
