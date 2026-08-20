import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: {
    default: 'AuraFlex Movies - Watch & Download Free HD Movies and Series',
    template: '%s | AuraFlex Movies',
  },
  description:
    'AuraFlex Movies is your official hub to stream and download full Bollywood, Hollywood, and regional movies in 1080p Full HD with zero popup ads.',
  keywords: [
    'AuraFlex Movies',
    'AuraFlex',
    'AuraFlex movie streaming',
    'AuraFlex movies download',
    'watch movies free online',
  ],
  metadataBase: new URL('https://auraflexmovies.vercel.app'),
  openGraph: {
    type: 'website',
    url: 'https://auraflexmovies.vercel.app',
    title: 'AuraFlex Movies - Watch & Download Free HD Movies and Series',
    description:
      'AuraFlex Movies is your official hub to stream and download full Bollywood, Hollywood, and regional movies in 1080p Full HD with zero popup ads.',
    siteName: 'AuraFlex Movies',
    images: [
      {
        url: 'https://auraflexmovies.vercel.app/icon.png',
        width: 512,
        height: 512,
        alt: 'AuraFlex Movies Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AuraFlex Movies - Watch & Download Free HD Movies and Series',
    description:
      'AuraFlex Movies is your official hub to stream and download full Bollywood, Hollywood, and regional movies in 1080p Full HD with zero popup ads.',
    images: ['https://auraflexmovies.vercel.app/icon.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
