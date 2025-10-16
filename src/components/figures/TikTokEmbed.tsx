
"use client";

import React, { useEffect, useState } from 'react';

const TikTokEmbed = ({ videoId }: { videoId: string }) => {
  const [embedSrc, setEmbedSrc] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const parentDomain = window.location.hostname;
      setEmbedSrc(`https://www.tiktok.com/embed/v2/${videoId}?refer=embed&embed_source=121374463&use_clips=false&parent_domain=${parentDomain}`);
    }
  }, [videoId]);


  if (!videoId || !embedSrc) return null;
  
  return (
    <iframe
      key={videoId}
      src={embedSrc}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
      }}
      title={`TikTok video ${videoId}`}
      allowFullScreen
      scrolling="no"
      allow="encrypted-media; autoplay; clipboard-write"
    />
  );
};

export default TikTokEmbed;
