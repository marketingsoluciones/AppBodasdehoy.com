export type VenueStyle =
  | 'romantico'
  | 'rustico-boho'
  | 'minimalista'
  | 'glamour'
  | 'jardin-floral'
  | 'industrial'
  | 'mediterraneo'
  | 'tropical';

export type VenueRoomType =
  | 'salon-banquetes'
  | 'jardin'
  | 'terraza'
  | 'iglesia'
  | 'restaurante'
  | 'finca'
  | 'rooftop';

export interface VenueVisualizerItem {
  error?: string;
  generatedUrl?: string;
  imageId?: string;
  originalUrl?: string;
  previewUrl?: string;
  prompt?: string;
  provider?: string;
  roomType: VenueRoomType;
  style: VenueStyle;
}
