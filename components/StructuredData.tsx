import React from 'react';

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
