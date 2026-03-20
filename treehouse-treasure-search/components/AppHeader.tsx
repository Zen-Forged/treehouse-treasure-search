"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export function AppHeader({
  title,
  showBack = false,
  backHref,
  onBack,
  rightElement,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-forest-950/90 backdrop-blur-sm border-b border-forest-800/50">
      <div className="w-10">
        {showBack &&
          (onBack ? (
            <button
              onClick={onBack}
              className="flex items-center justify-center w-9 h-9 rounded-full text-bark-300 hover:text-bark-100 hover:bg-forest-800/60 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
          ) : backHref ? (
            <Link
              href={backHref}
              className="flex items-center justify-center w-9 h-9 rounded-full text-bark-300 hover:text-bark-100 hover:bg-forest-800/60 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </Link>
          ) : null)}
      </div>

      <div className="flex-1 text-center">
        {title ? (
          <span className="font-display text-sm font-medium text-bark-200 tracking-wide">
            {title}
          </span>
        ) : (
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-forest-400 text-lg">🌲</span>
            <span className="font-display text-bark-100 text-base font-semibold tracking-wide">
              Treehouse
            </span>
          </Link>
        )}
      </div>

      <div className="w-10 flex justify-end">{rightElement}</div>
    </header>
  );
}
