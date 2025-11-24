'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { DayPicker, Matcher, DateRange, DropdownProps } from 'react-day-picker'
import 'react-day-picker/style.css'
import { Calendar as CalendarIcon } from 'lucide-react'

type DatePickerProps = {
  value?: string | Date | null
  onChange: (value: string) => void
  disabled?: Matcher | Matcher[]
  placeholder?: string
  className?: string
  format?: (date: Date) => string
  captionLayout?: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years'
  fromYear?: number
  toYear?: number
  fromDate?: Date
  toDate?: Date
}

type DateRangeValue = { from?: string; to?: string }

type DateRangePickerProps = {
  value?: DateRange | DateRangeValue | null
  onChange: (value: DateRangeValue) => void
  disabled?: Matcher | Matcher[]
  placeholder?: string
  className?: string
  formatRange?: (from?: Date, to?: Date) => string
  captionLayout?: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years'
  fromYear?: number
  toYear?: number
  fromDate?: Date
  toDate?: Date
}

function parseISODateString(s?: string | null): Date | undefined {
  if (!s) return undefined
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})/.exec(s)
  if (!m) {
    const d = new Date(s)
    return isNaN(d.getTime()) ? undefined : d
  }
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  return new Date(y, mo - 1, d)
}

const formatDateToReadable = (date: Date) => {
  return date.toLocaleString('default', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

function CustomDropdown(props: DropdownProps) {
  const { className = '', options = [], ...rest } = props
  return (
    <select
      {...rest}
      className={`px-2 py-1 text-sm rounded-md border bg-input border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${className}`}
    >
      {options?.map((opt) => (
        <option key={String(opt.value)} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function toISODateString(d?: Date | null): string {
  if (!d) return ''
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

function useOutsideClose(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      const t = e.target as HTMLElement
      if (ref.current && !ref.current.contains(t)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [ref, onClose])
}

export function DatePicker({
  value,
  onChange,
  disabled,
  placeholder = 'Select date',
  className = '',
  format,
  captionLayout,
  fromYear,
  toYear,
  fromDate,
  toDate,
}: DatePickerProps) {
  const initial = useMemo(() => {
    if (value instanceof Date) return value
    if (typeof value === 'string') return parseISODateString(value)
    return undefined
  }, [value])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Date | undefined>(initial)
  const containerRef = useRef<HTMLDivElement>(null)
  useOutsideClose(containerRef, () => setOpen(false))

  useEffect(() => {
    if (value instanceof Date) setSelected(value)
    else if (typeof value === 'string') setSelected(parseISODateString(value))
    else setSelected(undefined)
  }, [value])

  const display = selected ? (format ? format(selected) : formatDateToReadable(selected)) : ''

  function handleSelect(d?: Date) {
    setSelected(d)
    if (d) onChange(toISODateString(d))
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex justify-between items-center px-4 py-3 w-full rounded-lg border bg-input border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        <span className={display ? '' : 'text-muted-foreground'}>{display || placeholder}</span>
        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-50 mt-2 p-2 rounded-xl border bg-popover border-border shadow-md w-[20rem] max-w-[90vw]">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={disabled}
            defaultMonth={selected || new Date()}
            showOutsideDays
            captionLayout={captionLayout}
            fromYear={fromYear}
            toYear={toYear}
            fromDate={fromDate}
            toDate={toDate}
            components={{ Dropdown: CustomDropdown }}
          />
        </div>
      )}
    </div>
  )
}

export function DateRangePicker({
  value,
  onChange,
  disabled,
  placeholder = 'Select date range',
  className = '',
  formatRange,
  captionLayout,
  fromYear,
  toYear,
  fromDate,
  toDate,
}: DateRangePickerProps) {
  const initialRange: DateRange | undefined = useMemo(() => {
    if (!value) return undefined
    if ('from' in (value as any) || 'to' in (value as any)) {
      const v = value as DateRangeValue
      const from = parseISODateString(v.from)
      const to = parseISODateString(v.to)
      if (!from && !to) return undefined
      if (from && to) return { from, to }
      if (from) return { from }
      return undefined
    }
    const v = value as DateRange
    if (!v?.from && !v?.to) return undefined
    if (v?.from && v?.to) return { from: v.from, to: v.to }
    if (v?.from) return { from: v.from }
    return undefined
  }, [value])
  const [open, setOpen] = useState(false)
  const [range, setRange] = useState<DateRange | undefined>(initialRange)
  const containerRef = useRef<HTMLDivElement>(null)
  useOutsideClose(containerRef, () => setOpen(false))

  useEffect(() => {
    setRange(initialRange)
  }, [initialRange])

  const display = useMemo(() => {
    if (formatRange) return formatRange(range?.from, range?.to)
    const f = range?.from ? formatDateToReadable(range.from) : ''
    const t = range?.to ? formatDateToReadable(range.to) : ''
    return f && t ? `${f} - ${t}` : f || t || ''
  }, [formatRange, range])

  function handleSelect(r?: DateRange) {
    setRange(r)
    const out: DateRangeValue = {
      from: r?.from ? toISODateString(r.from) : undefined,
      to: r?.to ? toISODateString(r.to) : undefined,
    }
    onChange(out)
  }

  const monthToShow = range?.to || range?.from || new Date()

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex justify-between items-center px-4 py-3 w-full rounded-lg border bg-input border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        <span className={display ? '' : 'text-muted-foreground'}>{display || placeholder}</span>
        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-50 mt-2 p-2 rounded-xl border bg-popover border-border shadow-md w-[20rem] max-w-[90vw]">
          <DayPicker
            mode="range"
            selected={range?.from ? range : undefined}
            onSelect={handleSelect}
            disabled={disabled}
            defaultMonth={monthToShow}
            showOutsideDays
            captionLayout={captionLayout}
            fromYear={fromYear}
            toYear={toYear}
            fromDate={fromDate}
            toDate={toDate}
            components={{ Dropdown: CustomDropdown }}
          />
        </div>
      )}
    </div>
  )
}

export default DatePicker
