import React from 'react';
import { MediaSection, MediaSectionProps } from './MediaSection';

export const MobileMediaGrid: React.FC<MediaSectionProps> = (props) => {
  return <MediaSection {...props} />;
};

export { MediaSection };
