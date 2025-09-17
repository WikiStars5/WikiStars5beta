
"use client";

import React from 'react';

const TikTokEmbed = ({ videoId }: { videoId: string }) => {
  if (!videoId) return null;
  
  return (
    <iframe
      key={videoId} // Add key to ensure re-render on videoId change
      src={`https://www.tiktok.com/embed/v2/${videoId}`}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: '8px'
      }}
      title={`TikTok video ${videoId}`}
      allowFullScreen
      scrolling="no"
      allow="encrypted-media; autoplay; clipboard-write"
    />
  );
};

export default TikTokEmbed;
