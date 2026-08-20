import React from 'react';

export default function HomePage() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AuraFlex Movies',
    alternateName: ['AuraFlex', 'AuraFlexMovies'],
    url: 'https://auraflexmovies.vercel.app',
  };

  return (
    <main className="min-h-screen bg-[#0b0c0f] text-white p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <h1 className="text-3xl font-extrabold text-white mb-4">
        Welcome to <span className="text-red-500">AuraFlex Movies</span>
      </h1>
      <p className="text-gray-300">
        Stream & Download 1080p Full HD Bollywood, Hollywood, and Regional Movies & Series with zero popup ads.
      </p>
    </main>
  );
}
