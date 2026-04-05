import './globals.css'
import { Viewport } from 'next' // Viewport টাইপ ইম্পোর্ট করুন

export const metadata = {
  title: 'SeaLand Operations',
  description: 'Inventory and Billing Management',
}

// Next.js 14+ ভার্সনে ভিউপোর্ট আলাদাভাবে লিখতে হয়
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // এটি user-scalable=0 এর কাজ করবে
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