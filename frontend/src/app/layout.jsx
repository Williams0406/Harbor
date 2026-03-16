import './globals.css'

export const metadata = {
  title: 'Harbor Supplies — ERP',
  description: 'Sistema de gestión empresarial Harbor Supplies',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}