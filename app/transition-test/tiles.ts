// app/transition-test/tiles.ts
// Static tile data for the testbed — six color tiles. No data fetching;
// the goal is to test the animation runtime, not real data integration.

export const TILES = [
  { id: "red",    color: "#c84a3e", name: "Vermillion" },
  { id: "orange", color: "#e07a3a", name: "Burnt Orange" },
  { id: "yellow", color: "#d8a73c", name: "Goldenrod" },
  { id: "green",  color: "#4a7c45", name: "Forest" },
  { id: "blue",   color: "#3e6a9c", name: "Indigo" },
  { id: "purple", color: "#7a4a8c", name: "Plum" },
] as const;

export type Tile = (typeof TILES)[number];

export function findTile(id: string): Tile | undefined {
  return TILES.find((t) => t.id === id);
}
