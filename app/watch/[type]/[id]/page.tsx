import { Metadata } from 'next';
import React from 'react';
import WatchScreen from '../[id]';

interface Props {
  params: { type: string; id: string };
  searchParams?: { season?: string; episode?: string };
}

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || '5f85fd51bf4325e76cad21aadfe1ecc6';

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const siteUrl = 'https://auraflexmovies.vercel.app';
  const mediaId = params.id;
  const mediaType = params.type === 'tv' || params.type === 'anime' ? 'tv' : 'movie';

  try {
    const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${mediaId}?api_key=${TMDB_API_KEY}&language=en-US`, {
      next: { revalidate: 86400 },
    });
    
    let movie = await res.json();

    if (!movie || movie.status_message) {
      return {
        title: 'Watch Movie Online 1080p HD - AuraFlex Movies',
        description: 'Stream and download full HD movies with zero popups on AuraFlex Movies.',
      };
    }

    const title = movie.title || movie.name || 'Featured Release';
    const year = (movie.release_date || movie.first_air_date || '').split('-')[0] || '2026';
    const seasonEp = searchParams?.season && searchParams?.episode ? `S${searchParams.season} E${searchParams.episode} ` : '';

    return {
      title: `Watch ${title} ${seasonEp}(${year}) Full Movie Online 1080p HD - AuraFlex Movies`,
      description: `Stream and download ${title} (${year}) in Full 1080p HD with zero popups and fast servers on AuraFlex Movies.`,
      keywords: [
        `AuraFlex Movies ${title}`,
        `watch ${title} online free`,
        `${title} full movie 1080p download`,
        `${title} ${year} stream`,
        'AuraFlex movies',
        'watch free movies online',
        'hindi dubbed movies 1080p',
      ],
      openGraph: {
        title: `Watch ${title} (${year}) in 1080p HD - AuraFlex`,
        description: movie.overview ? movie.overview.slice(0, 160) : `Stream ${title} in Full HD on AuraFlex Movies.`,
        url: `${siteUrl}/watch/${params.type}/${params.id}`,
        siteName: 'AuraFlex Movies',
        images: [
          {
            url: movie.backdrop_path
              ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
              : movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : `${siteUrl}/icon.png`,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        type: 'video.movie',
      },
      twitter: {
        card: 'summary_large_image',
        title: `Watch ${title} (${year}) in 1080p HD - AuraFlex`,
        description: movie.overview ? movie.overview.slice(0, 160) : `Stream ${title} in Full HD on AuraFlex Movies.`,
        images: [
          movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
            : movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : `${siteUrl}/icon.png`,
        ],
      },
      alternates: {
        canonical: `${siteUrl}/watch/${params.type}/${params.id}`,
      },
    };
  } catch {
    return {
      title: 'Watch Movie Online 1080p HD - AuraFlex Movies',
      description: 'Stream and download full HD movies with zero popups on AuraFlex Movies.',
    };
  }
}

export default async function WatchTypePage({ params }: Props) {
  const mediaId = params.id;
  const mediaType = params.type === 'tv' || params.type === 'anime' ? 'tv' : 'movie';
  let movie: any = null;

  try {
    const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${mediaId}?api_key=${TMDB_API_KEY}&language=en-US`, {
      next: { revalidate: 86400 },
    });
    if (res.ok) movie = await res.json();
  } catch {}

  const jsonLd = movie && !movie.status_message
    ? {
        '@context': 'https://schema.org',
        '@type': mediaType === 'tv' ? 'TVSeries' : 'Movie',
        name: movie.title || movie.name,
        image: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : 'https://auraflexmovies.vercel.app/icon.png',
        description: movie.overview || `Stream ${movie.title || movie.name} online free in HD on AuraFlex Movies.`,
        datePublished: movie.release_date || movie.first_air_date || '2026-01-01',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: movie.vote_average ? String(movie.vote_average.toFixed(1)) : '7.5',
          bestRating: '10',
          ratingCount: movie.vote_count ? String(movie.vote_count) : '100',
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <WatchScreen />
    </>
  );
}
