// types/find.ts
export interface FindRecord {
  id: string;
  createdAt: string;
  imageOriginal: string;
  imageEnhanced?: string;
  caption?: string;
  captionRefined?: string;
  intentText?: string;
  intentChips?: IntentChip[];
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
  captionRefined?: string;
  intentText?: string;
  intentChips?: IntentChip[];
  pricePaid?: number;
  // Mock AI discovery data
  titleGuess?: string;
  description?: string;
}

export type IntentChip = "curious" | "selling" | "sharing" | "offers";

export type StoryPostType =
  | "Found in the Wild"
  | "From the Treehouse"
  | "The Search"
  | "Gone, but Kept";

export type StoryStatus =
  | "Available"
  | "Found & Shared"
  | "Moved On";

export interface StoryOutput {
  postType:       StoryPostType;
  caption:        string;
  altCaption:     string;
  scene:          string;
  imagePrompt:    string;
}
