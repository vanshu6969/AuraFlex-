import React from 'react';
import { MediaCard, MediaCardProps } from './MediaCard';

export const MobileMediaCard: React.FC<MediaCardProps> = (props) => {
  return <MediaCard {...props} />;
};

export { MediaCard };
