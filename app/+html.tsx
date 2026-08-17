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

        {/* Primary SEO Meta Tags */}
        <title>AuraFlex - Stream Movies, TV Series & Dramas Online</title>
        <meta
          name="description"
          content="Stream high-definition movies, TV shows, Pakistani dramas, Punjabi web series, and anime online free on AuraFlex. Fast multi-server video player."
        />
        <meta
          name="keywords"
          content="auraflex, auraflex movies, stream movies online, watch dramas online, pakistani dramas free, punjabi web series, free movie streaming, vega cinema"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://auraflexmovies.vercel.app/" />

        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="-ohE-sj98-EW1SdElsxFLL9ZYiKWKIcw6il8dcwLRk0" />
        <meta name="google-site-verification" content="ZokIMoeK71DjYGxUzIJldeCGWV0uYfHZ4U9B3LVOg0s" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://auraflexmovies.vercel.app/" />
        <meta property="og:title" content="AuraFlex - Stream Movies, TV Series & Dramas Online" />
        <meta
          property="og:description"
          content="Stream high-definition movies, TV shows, Pakistani dramas, Punjabi web series, and anime online free on AuraFlex."
        />
        <meta property="og:image" content="https://auraflexmovies.vercel.app/assets/icon.png" />
        <meta property="og:site_name" content="AuraFlex" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://auraflexmovies.vercel.app/" />
        <meta name="twitter:title" content="AuraFlex - Stream Movies, TV Series & Dramas Online" />
        <meta
          name="twitter:description"
          content="Stream high-definition movies, TV shows, Pakistani dramas, Punjabi web series, and anime online free on AuraFlex."
        />
        <meta name="twitter:image" content="https://auraflexmovies.vercel.app/assets/icon.png" />

        {/* Schema.org WebSite JSON-LD for Google Sitelinks SearchBox */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'AuraFlex Movies',
              alternateName: ['AuraFlex', 'Vega Cinema', 'AuraFlex Cinema'],
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
      </head>
      <body>{children}</body>
    </html>
  );
}
