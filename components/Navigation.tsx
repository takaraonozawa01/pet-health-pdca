'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/',                 label: 'ダッシュボード',      icon: '🏠' },
  { href: '/products/tierra',  label: 'TIERRA詳細',          icon: '📊' },
  { href: '/reports',          label: 'AIレポート',          icon: '📝' },
  { href: '/actions',          label: 'アクション管理',      icon: '✅' },
  { href: '/import',           label: 'データインポート',    icon: '📥' },
]

function isActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

export default function Navigation() {
  const pathname = usePathname()

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 bg-slate-900 h-screen sticky top-0 overflow-y-auto">
        {/* logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <p className="text-white font-bold text-lg leading-tight">🐾 PetHealth</p>
          <p className="text-slate-400 text-xs mt-0.5">PDCA Dashboard</p>
        </div>

        {/* nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = isActive(href, pathname)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-slate-700 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-base w-5 text-center">{icon}</span>
                <span className="truncate">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* footer */}
        <div className="px-5 py-4 border-t border-slate-800">
          <p className="text-slate-600 text-xs">MVP v1.0</p>
          <p className="text-slate-600 text-xs mt-0.5">TIERRA 先行実装</p>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-slate-900 border-t border-slate-700 flex items-center justify-around px-1">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = isActive(href, pathname)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-0 ${
                active ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-lg leading-tight">{icon}</span>
              <span className="text-[10px] leading-tight truncate max-w-[52px] text-center">
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
