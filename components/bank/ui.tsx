'use client'

import Link from 'next/link'
import { useId, type ComponentProps, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LotStatus } from '@/lib/bank'
import { STATUS_LABEL } from '@/lib/bank'

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-balance text-3xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="text-pretty text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn('rounded-xl border bg-card p-5 shadow-sm', className)} {...props} />
}

export function CardTitle({ children, icon, action }: { children: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        {icon}
        {children}
      </h2>
      {action}
    </div>
  )
}

const btnBase =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 px-5 py-2 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:size-5 [&_svg]:shrink-0'
const btnVariants = {
  primary: 'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border-foreground/70 bg-card text-foreground hover:bg-muted',
  danger: 'border-destructive bg-destructive text-primary-foreground hover:bg-destructive/90',
  ghost: 'border-transparent bg-transparent text-primary underline-offset-4 hover:underline',
}
type BtnVariant = keyof typeof btnVariants

export function Btn({ variant = 'primary', className, ...props }: ComponentProps<'button'> & { variant?: BtnVariant }) {
  return <button type="button" className={cn(btnBase, btnVariants[variant], className)} {...props} />
}

export function BtnLink({ variant = 'primary', className, ...props }: ComponentProps<typeof Link> & { variant?: BtnVariant }) {
  return <Link className={cn(btnBase, btnVariants[variant], className)} {...props} />
}

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string
  hint?: string
  error?: string | null
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode
  className?: string
}) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errId = error ? `${id}-err` : undefined
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-base font-bold">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error ? (
        <p id={errId} className="text-sm font-bold text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

const inputBase =
  'min-h-12 w-full rounded-lg border-2 border-input bg-card px-3 py-2 text-base text-foreground placeholder:text-muted-foreground/80 aria-invalid:border-destructive disabled:bg-muted'

export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(inputBase, className)} {...props} />
}

export function SelectInput({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(inputBase, 'cursor-pointer', className)} {...props} />
}

export function TextArea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea rows={3} className={cn(inputBase, 'min-h-20', className)} {...props} />
}

const alertStyles = {
  info: { box: 'border-primary/40 bg-secondary text-secondary-foreground', Icon: Info },
  warning: { box: 'border-warning/50 bg-warning-soft text-warning', Icon: AlertTriangle },
  error: { box: 'border-destructive/50 bg-destructive-soft text-destructive', Icon: XCircle },
  success: { box: 'border-success/50 bg-success-soft text-success', Icon: CheckCircle2 },
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: keyof typeof alertStyles
  title?: string
  children?: ReactNode
  className?: string
}) {
  const { box, Icon } = alertStyles[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-lg border-2 p-4', box, className)}>
      <Icon className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-1 text-foreground">
        {title ? <p className="font-bold">{title}</p> : null}
        {children ? <div className="text-pretty">{children}</div> : null}
      </div>
    </div>
  )
}

const statusStyles: Record<LotStatus, string> = {
  disponible: 'bg-success-soft text-success border-success/40',
  por_vencer: 'bg-warning-soft text-warning border-warning/50',
  vencido: 'bg-destructive-soft text-destructive border-destructive/50',
  revision: 'bg-warning-soft text-warning border-warning/50',
  no_apto: 'bg-destructive-soft text-destructive border-destructive/50',
  agotado: 'bg-muted text-muted-foreground border-border',
}

export function StatusBadge({ status }: { status: LotStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-sm font-bold whitespace-nowrap', statusStyles[status])}>
      {STATUS_LABEL[status]}
    </span>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border-2 border-dashed p-4 text-center text-muted-foreground">{children}</p>
}
