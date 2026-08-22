import React, { useEffect } from 'react';

interface StructuredDataProps {
  type?: 'website' | 'movie' | 'tv' | 'anime';
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  year?: string | number;
  season?: number;
  episode?: number;
  genres?: string[];
  quality?: string;
  language?: string;
  directUrl?: string;
}

export const StructuredData: React.FC<StructuredDataProps> = ({
  type = 'website',
  title = 'AuraFlex Movies - Watch & Download Free HD Movies and Series',
  description,
  image = 'https://auraflexmovies.vercel.app/icon.png',
  url = 'https://auraflexmovies.vercel.app',
  year = '2026',
  season,
  episode,
  genres = ['Action', 'Drama'],
  quality = '1080p Full HD',
  language = 'English & Hindi Subtitles',
  directUrl,
}) => {
  const isMedia = type === 'movie' || type === 'tv' || type === 'anime';

  // Format exact title required: Watch [Movie Name] (Year) Full Movie Online 1080p HD - AuraFlex
  const yearSuffix = year ? `(${year})` : '';
  const episodePill = season && episode ? `S${season} E${episode} ` : '';
  const mediaLabel = type === 'tv' || type === 'anime' ? 'Full Series' : 'Full Movie';
  
  const formattedTitle = isMedia
    ? `Watch ${title} ${episodePill}${yearSuffix} ${mediaLabel} Online 1080p HD - AuraFlex`
    : title.includes('AuraFlex') ? title : `${title} - AuraFlex`;

  // Format exact description required: Stream [Movie Name] in Full HD with English & Hindi subtitles. 1-click fast streaming, zero popups on AuraFlex Movies.
  const formattedDescription = isMedia
    ? `Stream ${title} in Full HD with English & Hindi subtitles. 1-click fast streaming, zero popups on AuraFlex Movies.`
    : description || 'AuraFlex Movies is your official hub to stream and download full Bollywood, Hollywood, Punjabi, and regional movies in 1080p Full HD with zero popup ads.';

  // High-demand search keywords tailored for Google long-tail search traffic
  const keywordList = isMedia
    ? [
        `Watch ${title} free online`,
        `${title} ${yearSuffix} full movie online 1080p hd`,
        `Stream ${title} full movie`,
        `${title} hindi dubbed watch online`,
        `${title} english subtitles`,
        `${title} 1-click fast streaming`,
        `${title} regional release download`,
        `AuraFlex Movies`,
        `AuraFlex`,
      ].join(', ')
    : 'AuraFlex Movies, watch movies free online, 1080p HD movies, Bollywood, Hollywood, K-Drama, Anime, Punjabi movies';

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

    const setLinkRel = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // Update document title & meta tags for Search Engine Crawlers
    document.title = formattedTitle;
    setMeta('description', formattedDescription, true);
    setMeta('keywords', keywordList, true);
    setLinkRel('canonical', url);

    // OpenGraph Protocol
    setMeta('og:title', formattedTitle);
    setMeta('og:description', formattedDescription);
    setMeta('og:image', image);
    setMeta('og:url', url);
    setMeta('og:site_name', 'AuraFlex Movies');
    setMeta('og:type', type === 'movie' || type === 'tv' ? 'video.movie' : 'website');
    if (directUrl) {
      setMeta('og:video', directUrl);
      setMeta('og:video:type', 'video/mp4');
    }

    // Twitter Card Tags for Telegram, WhatsApp, and social link sharing
    setMeta('twitter:card', 'summary_large_image', true);
    setMeta('twitter:title', formattedTitle, true);
    setMeta('twitter:description', formattedDescription, true);
    setMeta('twitter:image', image, true);
  }, [formattedTitle, formattedDescription, keywordList, image, url, type, directUrl]);

  // Schema.org Website Structured Data
  const websiteSchema = {
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
  };

  // Schema.org Movie / TVSeries Rich Snippet Structured Data
  const mediaSchema = isMedia
    ? {
        '@context': 'https://schema.org',
        '@type': type === 'tv' || type === 'anime' ? 'TVSeries' : 'Movie',
        name: title,
        description: formattedDescription,
        image: image,
        url: url,
        datePublished: year ? `${year}-01-01` : '2026-01-01',
        genre: genres,
        videoQuality: quality,
        inLanguage: language,
        provider: {
          '@type': 'Organization',
          name: 'AuraFlex Movies',
          url: 'https://auraflexmovies.vercel.app',
        },
        potentialAction: {
          '@type': 'WatchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: url,
            actionPlatform: [
              'http://schema.org/DesktopWebPlatform',
              'http://schema.org/MobileWebPlatform',
              'http://schema.org/IOSPlatform',
              'http://schema.org/AndroidPlatform',
            ],
          },
          actionStatus: 'http://schema.org/CompletedActionStatus',
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
