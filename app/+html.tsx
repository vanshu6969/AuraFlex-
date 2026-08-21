import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Root HTML file for Expo Web.
 * Configures technical SEO, OpenGraph tags, Schema.org JSON-LD, and Google Search Console verification.
 */
export default function HTML({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* PWA & Web App Manifest Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#e50914" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AuraFlex Movies" />
        <link rel="apple-touch-icon" href="/icon.png" />

        {/* Primary SEO Meta Tags */}
        <title>AuraFlex Movies - Watch & Download Free HD Movies and Series</title>
        <meta
          name="description"
          content="AuraFlex Movies is your official hub to stream and download full Bollywood, Hollywood, and regional movies in 1080p Full HD with zero popup ads."
        />
        <meta
          name="keywords"
          content="AuraFlex Movies, AuraFlex, AuraFlex movie streaming, AuraFlex movies download, watch movies free online"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://auraflexmovies.vercel.app/" />

        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="-ohE-sj98-EW1SdElsxFLL9ZYiKWKIcw6il8dcwLRk0" />
        <meta name="google-site-verification" content="ZokIMoeK71DjYGxUzIJldeCGWV0uYfHZ4U9B3LVOg0s" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://auraflexmovies.vercel.app/" />
        <meta property="og:title" content="AuraFlex Movies - Watch & Download Free HD Movies and Series" />
        <meta
          property="og:description"
          content="AuraFlex Movies is your official hub to stream and download full Bollywood, Hollywood, and regional movies in 1080p Full HD with zero popup ads."
        />
        <meta property="og:image" content="https://auraflexmovies.vercel.app/icon.png" />
        <meta property="og:site_name" content="AuraFlex Movies" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://auraflexmovies.vercel.app/" />
        <meta name="twitter:title" content="AuraFlex Movies - Watch & Download Free HD Movies and Series" />
        <meta
          name="twitter:description"
          content="AuraFlex Movies is your official hub to stream and download full Bollywood, Hollywood, and regional movies in 1080p Full HD with zero popup ads."
        />
        <meta name="twitter:image" content="https://auraflexmovies.vercel.app/icon.png" />

        {/* Schema.org WebSite JSON-LD for Google Sitelinks SearchBox */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'AuraFlex Movies',
              alternateName: ['AuraFlex', 'AuraFlexMovies'],
              url: 'https://auraflexmovies.vercel.app',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://auraflexmovies.vercel.app/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />

        <ScrollViewStyleReset />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  window.open = function() {
                    console.log("Blocked embed popunder redirect");
                    return null;
                  };
                } catch (e) {}
              })();
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              input:-webkit-autofill,
              input:-webkit-autofill:hover,
              input:-webkit-autofill:focus,
              input:-webkit-autofill:active {
                -webkit-box-shadow: 0 0 0 30px #0f0f12 inset !important;
                -webkit-text-fill-color: #ffffff !important;
                transition: background-color 5000s ease-in-out 0s;
              }
            `,
          }}
        />
      </head>

      <body>{children}</body>
    </html>
  );
}
