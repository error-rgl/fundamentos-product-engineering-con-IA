'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { BarChart3, Boxes, HandHeart, Home, PackagePlus, Scale, Settings, Truck, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBank } from '@/lib/store'

const NAV = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/donaciones', label: 'Donaciones', icon: PackagePlus },
  { href: '/inventario', label: 'Inventario', icon: Boxes },
  { href: '/familias', label: 'Familias', icon: Users },
  { href: '/entregas', label: 'Entregas', icon: Truck },
  { href: '/distribucion', label: 'Reparto justo', icon: Scale },
  { href: '/necesidades', label: 'Necesidades', icon: HandHeart },
  { href: '/indicadores', label: 'Indicadores', icon: BarChart3 },
  { href: '/ajustes', label: 'Ajustes', icon: Settings },
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const state = useBank()
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:p-3 focus:font-bold"
      >
        Ir al contenido
      </a>
      <header className="border-b-2 bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-3 self-start">
            <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HandHeart className="size-6" aria-hidden="true" />
            </span>
            <span className="text-xl font-bold leading-tight">{state?.settings.bankName ?? 'Banco de Alimentos'}</span>
          </Link>
          <nav aria-label="Secciones">
            <ul className="flex flex-wrap gap-1.5">
              {NAV.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive(href) ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center gap-2 rounded-lg border-2 px-3 text-base font-bold',
                      isActive(href)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-transparent text-foreground hover:border-border hover:bg-muted',
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {state ? children : <p className="py-16 text-center text-lg text-muted-foreground">Cargando datos del dispositivo…</p>}
      </main>
      <footer className="border-t-2 bg-card">
        <p className="mx-auto max-w-6xl px-4 py-3 text-sm text-muted-foreground">
          Los datos se guardan en este dispositivo. Haga una copia de seguridad cada semana desde Ajustes.
        </p>
      </footer>
    </div>
  )
}
