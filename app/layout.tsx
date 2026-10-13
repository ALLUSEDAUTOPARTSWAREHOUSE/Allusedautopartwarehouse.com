import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Roboto } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/lib/auth-context'
import { MobileThemeFab } from '@/components/mobile-theme-fab'
import { IntercomProvider } from '@/components/intercom-provider'
import { GoogleCustomerReviewsBadge } from '@/components/google-customer-reviews'
import { LiveChatWidget } from '@/components/chat/live-chat-widget'
import { auth } from '@/lib/auth'
import './globals.css'

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.allusedautopartswarehouse.com'),
  title: 'AUAPW LLC - Quality Used Auto Parts | Engines, Transmissions & More',
  description: 'AUAPW LLC - Your trusted source for quality used auto parts. Shop engines, transmissions, body parts and more from 2,000+ verified salvage yards nationwide. $240 flat-rate shipping per part and a 90-day warranty.',
  generator: 'v0.dev',
  applicationName: 'AUAPW LLC',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  alternates: {
    // './' resolves to each page's own path; an absolute homepage URL here
    // would mark every page as a duplicate of the homepage.
    canonical: './',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    url: './',
    siteName: 'AUAPW LLC',
    title: 'AUAPW LLC - Quality Used Auto Parts | Engines, Transmissions & More',
    description: 'Your trusted source for quality used auto parts. Shop engines, transmissions, body parts and more from 2,000+ verified salvage yards nationwide.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@auapworg',
    title: 'AUAPW LLC - Quality Used Auto Parts',
    description: 'Your trusted source for quality used auto parts. Engines, transmissions, body parts and more from 2,000+ verified salvage yards.',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'AUAPW LLC',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#0d0f16',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let intercomUser
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (session?.user) {
      intercomUser = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      }
    }
  } catch (error) {
    console.error('[Intercom] Could not load the current session:', error)
  }

  return (
    <html lang="en" className="dark bg-background" suppressHydrationWarning>
      <body className={`${roboto.variable} font-sans antialiased bg-background text-foreground`}>
        {/* Intercom messenger — loads after page is interactive */}
        <Script 
          id="intercom-bootstrap"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/pldz9zi1';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(d.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
            `,
          }}
        />
        <AuthProvider>
          <ThemeProvider>
            {children}
            <MobileThemeFab />
            <IntercomProvider user={intercomUser} />
            <LiveChatWidget />
          </ThemeProvider>
        </AuthProvider>
        <GoogleCustomerReviewsBadge />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
