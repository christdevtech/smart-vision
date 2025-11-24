'use client'

import { useMemo } from 'react'
import { Check } from 'lucide-react'

export type BadgeOption = { value: string; label: string }

type BadgeSelectProps = {
  options: BadgeOption[]
  selected: string[]
  onChange: (next: string[]) => void
  ariaLabel?: string
  className?: string
  mode?: 'multi' | 'single'
}

export default function BadgeSelect({
  options,
  selected,
  onChange,
  ariaLabel,
  className = '',
  mode = 'multi',
}: BadgeSelectProps) {
  const setSelected = (val: string, isSelected: boolean) => {
    if (mode === 'single') {
      const next = isSelected ? [] : [val]
      onChange(next)
      return
    }
    const next = isSelected ? selected.filter((s) => s !== val) : [...selected, val]
    onChange(next)
  }

  const map = useMemo(() => new Set(selected), [selected])

  return (
    <div role="group" aria-label={ariaLabel} className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((opt) => {
        const isActive = map.has(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            role={mode === 'single' ? 'radio' : 'checkbox'}
            aria-checked={isActive}
            aria-label={opt.label}
            tabIndex={0}
            onClick={() => setSelected(opt.value, isActive)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                setSelected(opt.value, isActive)
              }
            }}
            className={`min-w-[48px] px-3 py-1 inline-flex items-center gap-2 rounded-full border transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary text-foreground border-border'
            }`}
          >
            {isActive && <Check className="w-4 h-4" />}
            <span className="text-sm font-medium">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
