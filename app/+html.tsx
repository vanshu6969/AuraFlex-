import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Root HTML file for Expo Web.
 * Injects main HTML/index script before rendering any iframe or React component.
 */
export default function HTML({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="google-site-verification" content="-ohE-sj98-EW1SdElsxFLL9ZYiKWKIcw6il8dcwLRk0" />
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
