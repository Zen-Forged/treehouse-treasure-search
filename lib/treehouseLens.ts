// Treehouse Lens — render-time photo filter applied to every vendor-posted find
// across the ecosystem layer. Original photo is stored unchanged in Supabase Storage;
// shoppers and vendors both see the lensed result via this CSS filter.
//
// Ported from the reseller-layer canvas op at app/discover/page.tsx (red +6%,
// blue -8%, contrast +8%) as a CSS approximation. Tune in one place.
export const TREEHOUSE_LENS_FILTER = "contrast(1.08) saturate(1.05) sepia(0.05)";

export const treehouseLensStyle = {
  filter: TREEHOUSE_LENS_FILTER,
  WebkitFilter: TREEHOUSE_LENS_FILTER,
} as const;
