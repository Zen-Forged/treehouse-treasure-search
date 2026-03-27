// lib/mockAI.ts
// Mock AI functions — drop-in replacements when real AI is ready

import { IntentChip } from "@/types/find";

// Simulates Claude vision identifying an item
export function mockIdentifyItem(imageDataUrl: string): {
  titleGuess: string;
  description: string;
} {
  // Use image length as a simple seed for variety
  const seed = imageDataUrl.length % 8;
  const items = [
    {
      titleGuess: "Brass Owl Bookend",
      description: "Looks like a decorative brass piece — possibly a bookend or paperweight. The patina suggests age.",
    },
    {
      titleGuess: "Mid-Century Ceramic Vase",
      description: "A ceramic vessel with a matte glaze. The form and palette suggest mid-century American or Scandinavian origin.",
    },
    {
      titleGuess: "Cast Iron Bank",
      description: "A painted cast iron figurine, likely a still bank. These were popular in the early 20th century.",
    },
    {
      titleGuess: "Amber Glass Decanter",
      description: "A hand-blown amber glass decanter with a ground stopper. The color and weight feel intentional.",
    },
    {
      titleGuess: "Enamel Trinket Box",
      description: "A small enameled box with hand-painted detail. Could be French or English, likely decorative.",
    },
    {
      titleGuess: "Wooden Carved Figure",
      description: "A hand-carved wooden figure with folk art characteristics. The tool marks suggest it wasn't mass produced.",
    },
    {
      titleGuess: "Silver-Plate Serving Tray",
      description: "A silver-plated tray with decorative edging. The hallmarks, if present, would narrow the origin.",
    },
    {
      titleGuess: "Porcelain Figurine",
      description: "A small porcelain piece with hand-applied details. The glaze quality and weight suggest it's not modern reproduction.",
    },
  ];
  return items[seed];
}

// Simulates AI rewriting user intent text into a polished caption
export function mockRefineCaption(
  rawText: string,
  chips: IntentChip[]
): string {
  if (!rawText.trim()) {
    return "Found this today — not quite sure what it is yet, but something about it stood out. Anyone know more?";
  }

  // Simple transformations — replace hedged language with grounded language
  let refined = rawText
    .replace(/\bI think\b/gi, "")
    .replace(/\bmaybe\b/gi, "")
    .replace(/\bprobably\b/gi, "")
    .replace(/\bkind of\b/gi, "")
    .replace(/\bsort of\b/gi, "")
    .replace(/\bI guess\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Capitalise first letter
  refined = refined.charAt(0).toUpperCase() + refined.slice(1);

  // Add chip-appropriate closing line
  if (chips.includes("selling") || chips.includes("offers")) {
    refined += " Open to offers if anyone's interested.";
  } else if (chips.includes("curious")) {
    refined += " Would love to know more about this one.";
  } else if (chips.includes("sharing")) {
    refined += " Felt worth sharing.";
  }

  return refined;
}
