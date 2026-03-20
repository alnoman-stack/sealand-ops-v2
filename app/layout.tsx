import './globals.css'

export const metadata = {
  title: 'SeaLand Operations',
  description: 'Inventory and Billing Management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}> 
        {children}
      </body>
    </html>
  );
}