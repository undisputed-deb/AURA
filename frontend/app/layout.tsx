import type { Metadata } from "next";
import { Rubik, Orbitron, JetBrains_Mono, Share_Tech_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/ThemeProvider';
import Analytics from '@/components/Analytics';

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const shareTechMono = Share_Tech_Mono({
  variable: "--font-share-tech",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "Aura - AI Voice Interview Coach | Land The Role You Deserve",
    template: "%s | Aura"
  },
  description: "Land the role you deserve with Aura's AI-powered voice interview coach. Refine your pitch with AI-driven resume interrogation. Real-time voice feedback to crush your interviews.",
  keywords: [
    "interview practice",
    "mock interview",
    "AI interview coach",
    "job interview preparation",
    "voice interview practice",
    "technical interview prep",
    "behavioral interview questions",
    "interview feedback",
    "career coaching",
    "interview simulator",
    "job interview tips",
    "interview training",
    "AI voice coach",
    "practice interviews online",
    "interview preparation software"
  ],
  authors: [{ name: "Aura Team" }],
  creator: "Aura",
  publisher: "Aura",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Aura - AI Voice Interview Coach",
    description: "Practice real interviews with AI-powered coaching. Get instant feedback and ace your next interview.",
    siteName: "Aura",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Aura - AI Interview Coach Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aura - AI Voice Interview Coach",
    description: "Practice real interviews with AI-powered coaching. Get instant feedback and ace your next interview.",
    images: ["/og-image.png"],
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
  alternates: {
    canonical: "https://aura.dev",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#8b5cf6',
          colorBackground: '#0f172a',
          colorInputBackground: 'rgba(255, 255, 255, 0.05)',
          colorInputText: '#ffffff',
          colorText: '#ffffff',
          colorTextSecondary: '#d1d5db',
          colorNeutral: '#ffffff',
          borderRadius: '0.75rem',
          fontFamily: `${GeistSans.variable}, system-ui, sans-serif`,
        },
        elements: {
          formButtonPrimary:
            'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-purple-500/50 transition transform hover:scale-105',
          card: 'bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl',
          headerTitle: 'text-white',
          headerSubtitle: 'text-gray-300',
          socialButtonsBlockButton:
            'bg-white/5 border border-white/10 text-white hover:bg-white/10 transition',
          socialButtonsBlockButtonText: 'text-white',
          formFieldInput:
            'bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-blue-500',
          formFieldLabel: 'text-gray-200',
          footerActionLink: 'text-blue-400 hover:text-blue-300',
          identityPreviewText: 'text-white',
          identityPreviewEditButton: 'text-blue-400 hover:text-blue-300',
          formFieldInputShowPasswordButton: 'text-gray-300 hover:text-white',
          dividerLine: 'bg-white/20',
          dividerText: 'text-gray-300',
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${rubik.variable} ${GeistSans.variable} ${orbitron.variable} ${jetbrainsMono.variable} ${shareTechMono.variable} antialiased`}
        >
          <Analytics />
          <ThemeProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
