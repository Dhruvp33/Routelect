import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, keywords, url = 'https://routelect.com', image = 'https://routelect.com/og-image.jpg' }) => {
  return (
    <Helmet>
      <title>{title ? `${title} | Routelect` : 'Routelect — Smart EV Trip Planner for India'}</title>
      <meta name="description" content={description || 'Intelligent EV route planning for India with charging station integration. Plan your electric vehicle road trips seamlessly.'} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title ? `${title} | Routelect` : 'Routelect — Smart EV Trip Planner for India'} />
      <meta property="og:description" content={description || 'Intelligent EV route planning for India with charging station integration. Plan your electric vehicle road trips seamlessly.'} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title ? `${title} | Routelect` : 'Routelect — Smart EV Trip Planner for India'} />
      <meta property="twitter:description" content={description || 'Intelligent EV route planning for India with charging station integration. Plan your electric vehicle road trips seamlessly.'} />
      <meta property="twitter:image" content={image} />

      {/* Canonical Link */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEO;
