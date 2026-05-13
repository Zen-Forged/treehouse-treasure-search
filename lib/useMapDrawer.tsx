// lib/useMapDrawer.tsx
// Map drawer open-state context — session 157.
//
// HomeChrome owns the drawer mount (<MallMapDrawer> only renders on Home),
// but the open-state needs to be readable from the (tabs) layout's masthead
// (back button when drawer is expanded, per session 157 Item 3). Provider
// lives at the app/layout.tsx root so any page can consume — even non-Home
// pages just read drawerOpen as false (defensive default) without crashing
// if they happen to call useMapDrawer().
//
// Why context (not local state lifted to Home page): the masthead is in a
// shared layout component that mounts above the Home page in the React
// tree. Lifting state across that boundary would require prop drilling or
// a shared store. Context is the cleanest cross-boundary plumbing for a
// single boolean + 3 setters that don't need to fan out.
//
// Why root-layout scope (not (tabs)-layout scope): "available on all pages"
// per David's session 157 Q3 confirm. Non-(tabs) pages don't open the
// drawer today, but the context exists in case future surfaces (e.g.
// /find/[id]'s "view on map" affordance) want to disclose the map without
// remounting the whole chrome tree.

"use client";

import * as React from "react";

interface MapDrawerContextValue {
  drawerOpen:   boolean;
  openDrawer:   () => void;
  closeDrawer:  () => void;
  toggleDrawer: () => void;
}

const MapDrawerContext = React.createContext<MapDrawerContextValue>({
  drawerOpen:   false,
  openDrawer:   () => {},
  closeDrawer:  () => {},
  toggleDrawer: () => {},
});

export function MapDrawerProvider({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const value = React.useMemo<MapDrawerContextValue>(
    () => ({
      drawerOpen,
      openDrawer:   () => setDrawerOpen(true),
      closeDrawer:  () => setDrawerOpen(false),
      toggleDrawer: () => setDrawerOpen((prev) => !prev),
    }),
    [drawerOpen],
  );

  return (
    <MapDrawerContext.Provider value={value}>
      {children}
    </MapDrawerContext.Provider>
  );
}

export function useMapDrawer() {
  return React.useContext(MapDrawerContext);
}
