import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PetHealth PDCA',
  description: 'ペットヘルスケアEC KPI管理ダッシュボード',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <div className="flex h-screen overflow-hidden bg-slate-50">
          <Navigation />
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
