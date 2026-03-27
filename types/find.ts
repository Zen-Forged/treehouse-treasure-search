export interface FindRecord {
  id: string;
  createdAt: string;
  imageOriginal: string;
  imageEnhanced?: string;
  caption?: string;
  sourceNote?: string;
  pricePaid?: number;
  shared?: boolean;
  analysis?: {
    titleGuess?: string;
    description?: string;
    estimatedValue?: number;
    confidence?: number;
  };
}

export interface FindDraft {
  imageOriginal?: string;
  imageEnhanced?: string;
  caption?: string;
  pricePaid?: number;
}
