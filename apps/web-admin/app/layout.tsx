import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OrbitEdu · Admin Console',
  description:
    'OrbitEdu learning management system administration console.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh font-sans antialiased">
        {children}
      </body>
    </html>
  )
}