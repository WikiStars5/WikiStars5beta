
"use client";

import React from 'react';

const TikTokEmbed = ({ videoId, width = '325px', height = '578px' }) => {
  if (!videoId) return null;
  
  return (
    <iframe
      src={`https://www.tiktok.com/embed/v2/${videoId}`}
      width={width}
      height={height}
      style={{ border: 'none', maxWidth: '605px', minWidth: '325px', borderRadius: '8px' }}
      title={`TikTok video ${videoId}`}
      allowFullScreen
      scrolling="no"
      allow="encrypted-media; autoplay"
    />
  );
};

export default TikTokEmbed;
