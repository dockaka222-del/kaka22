import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Voice Cloning - Nhân Bản Giọng Nói AI',
  description: 'Ứng dụng nhân bản giọng nói bằng AI. Tạo audio mới với giọng nói của bạn từ văn bản tiếng Việt.',
  keywords: ['voice cloning', 'AI', 'text to speech', 'Vietnamese', 'giọng nói', 'nhân bản'],
  authors: [{ name: 'Voice Cloning App' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Voice Cloning - Nhân Bản Giọng Nói AI',
    description: 'Ứng dụng nhân bản giọng nói bằng AI. Tạo audio mới với giọng nói của bạn từ văn bản tiếng Việt.',
    type: 'website',
    locale: 'vi_VN',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 max-w-screen-2xl items-center">
                <div className="mr-4 flex">
                  <a className="mr-6 flex items-center space-x-2" href="/">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <span className="text-sm font-bold">VC</span>
                    </div>
                    <span className="hidden font-bold sm:inline-block">
                      Voice Cloning
                    </span>
                  </a>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                  <div className="w-full flex-1 md:w-auto md:flex-none">
                    <p className="text-sm text-muted-foreground">
                      Nhân bản giọng nói bằng AI
                    </p>
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t border-border/40 py-6 md:py-0">
              <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                  <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    Được xây dựng với{" "}
                    <a
                      href="https://nextjs.org"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium underline underline-offset-4"
                    >
                      Next.js
                    </a>{" "}
                    và{" "}
                    <a
                      href="https://ui.shadcn.com"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium underline underline-offset-4"
                    >
                      shadcn/ui
                    </a>
                    .
                  </p>
                </div>
              </div>
            </footer>
          </div>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}