import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lacks Expense Management',
  description: 'Expense reporting and management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
