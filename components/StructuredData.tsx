import React, { useEffect } from 'react';

interface StructuredDataProps {
  type?: 'website' | 'movie' | 'tv' | 'anime';
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  year?: string | number;
  genres?: string[];
  quality?: string;
  language?: string;
  directUrl?: string;
}

export const StructuredData: React.FC<StructuredDataProps> = ({
  type = 'website',
  title = 'AuraFlex - Stream Movies, TV Series & Dramas Online',
  description,
  image = 'https://auraflexmovies.vercel.app/assets/icon.png',
  url = 'https://auraflexmovies.vercel.app',
  year = '2026',
  genres = ['Action', 'Drama'],
  quality = '1080p Full HD',
  language = 'Hindi / Punjabi / English',
  directUrl,
}) => {
  const formattedTitle =
    type === 'movie' || type === 'tv' || type === 'anime'
      ? `${title} (${year}) ${language} ${quality} Watch Online & 1-Click Download Free - AuraFlex`
      : title;

  const defaultGlobalDesc =
    'Watch and download latest Bollywood, Hollywood, and Punjabi movies in 1080p Full HD. Fast streaming, zero ads, and direct 1-click downloads on AuraFlex.';

  const formattedDescription =
    type === 'movie' || type === 'tv' || type === 'anime'
      ? `Watch ${title} (${year}) full movie online in 1080p HD on AuraFlex. Stream in ${language} audio with zero popups or get fast direct 1-click high-speed download links.`
      : description || defaultGlobalDesc;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const setMeta = (property: string, content: string, isName = false) => {
      const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (isName) {
          element.setAttribute('name', property);
        } else {
          element.setAttribute('property', property);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    document.title = formattedTitle;
    setMeta('description', formattedDescription, true);

    // OpenGraph Protocol
    setMeta('og:title', formattedTitle);
    setMeta('og:description', formattedDescription);
    setMeta('og:image', image);
    setMeta('og:url', url);
    setMeta('og:type', type === 'movie' || type === 'tv' ? 'video.movie' : 'website');
    if (directUrl) {
      setMeta('og:video', directUrl);
      setMeta('og:video:type', 'video/mp4');
    }

    // Twitter Card Tags for Telegram & WhatsApp previews
    setMeta('twitter:card', 'summary_large_image', true);
    setMeta('twitter:title', formattedTitle, true);
    setMeta('twitter:description', formattedDescription, true);
    setMeta('twitter:image', image, true);
  }, [formattedTitle, formattedDescription, image, url, type, directUrl]);

  const websiteSchema = {
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
  };

  const mediaSchema =
    type === 'movie' || type === 'tv' || type === 'anime'
      ? {
          '@context': 'https://schema.org',
          '@type': type === 'tv' ? 'TVSeries' : 'Movie',
          name: title,
          description: description,
          image: image,
          url: url,
          datePublished: `${year}-01-01`,
          genre: genres,
          videoQuality: quality,
          inLanguage: language,
          provider: {
            '@type': 'Organization',
            name: 'AuraFlex',
            url: 'https://auraflexmovies.vercel.app',
          },
          potentialAction: {
            '@type': 'WatchAction',
            target: directUrl || url,
          },
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      {mediaSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(mediaSchema) }}
        />
      )}
    </>
  );
};
