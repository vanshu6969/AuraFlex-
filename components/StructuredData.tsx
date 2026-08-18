import React, { useEffect } from 'react';

interface StructuredDataProps {
  type?: 'website' | 'movie' | 'tv';
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export const StructuredData: React.FC<StructuredDataProps> = ({
  type = 'website',
  title = 'AuraFlex - Stream Movies, TV Series & Dramas Online',
  description = 'Stream high-definition movies, TV shows, Pakistani dramas, Punjabi web series, and anime online free on AuraFlex.',
  image = 'https://auraflexmovies.vercel.app/assets/icon.png',
  url = 'https://auraflexmovies.vercel.app',
}) => {
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

    document.title = title;
    setMeta('description', description, true);
    setMeta('og:title', title);
    setMeta('og:description', description);
    setMeta('og:image', image);
    setMeta('og:url', url);
    setMeta('og:type', type === 'movie' || type === 'tv' ? 'video.movie' : 'website');
    setMeta('twitter:card', 'summary_large_image', true);
    setMeta('twitter:title', title, true);
    setMeta('twitter:description', description, true);
    setMeta('twitter:image', image, true);
  }, [title, description, image, url, type]);

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
    type === 'movie' || type === 'tv'
      ? {
          '@context': 'https://schema.org',
          '@type': type === 'movie' ? 'Movie' : 'TVSeries',
          name: title,
          description: description,
          image: image,
          url: url,
          provider: {
            '@type': 'Organization',
            name: 'AuraFlex',
            url: 'https://auraflexmovies.vercel.app',
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
