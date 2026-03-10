import clsx from 'clsx'

const STATUS_CONFIG = {
  new:        { label: 'New',        class: 'bg-slate-700 text-slate-300' },
  selected:   { label: 'Selected',   class: 'bg-brand-600/20 text-brand-300 border border-brand-500/30' },
  shortlisted:{ label: 'Shortlisted',class: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
  rejected:   { label: 'Rejected',   class: 'bg-red-500/20 text-red-300 border border-red-500/30' },
}

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new
  return (
    <span className={clsx('badge', config.class)}>
      {config.label}
    </span>
  )
}

const CATEGORY_CONFIG = {
  'Top Candidate':       { class: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
  'Potential Candidate': { class: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
  'Low Match':           { class: 'bg-red-500/20 text-red-300 border border-red-500/30' },
}

export function CategoryBadge({ category }) {
  const config = CATEGORY_CONFIG[category] || { class: 'bg-slate-700 text-slate-300' }
  return (
    <span className={clsx('badge', config.class)}>
      {category}
    </span>
  )
}

export function ScoreBar({ score, color = 'brand' }) {
  const pct = Math.round((score || 0) * 100)
  const colorMap = {
    brand:   'bg-brand-500',
    emerald: 'bg-emerald-500',
    amber:   'bg-amber-500',
    red:     'bg-red-500',
  }
  const barColor = pct >= 75 ? colorMap.emerald : pct >= 50 ? colorMap.amber : colorMap.red

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-dark-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full score-bar ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-white font-bold text-sm w-10 text-right">{pct}%</span>
    </div>
  )
}
