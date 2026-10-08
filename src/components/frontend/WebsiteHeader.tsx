import React, { useState } from 'react';
import { ThemeSettings, Menu } from '../../types/cms';
import { Search, Menu as MenuIcon, X } from 'lucide-react';

interface Props {
  themeSettings: ThemeSettings;
  menus: Menu[];
  onOpenSearch: () => void;
  onNavigate: (path: string) => void;
  onOpenAdmin?: () => void;
}

export const WebsiteHeader: React.FC<Props> = ({
  themeSettings,
  menus,
  onOpenSearch,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerMenu = menus.find((m) => m.location === 'header') || menus[0];

  const { sticky = true, showSearch = true } =
    themeSettings.header || {};

  return (
    <header
      className={`bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all z-40 ${
        sticky ? 'sticky top-0 shadow-2xs' : 'relative'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <div
            onClick={() => onNavigate('/')}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          >
            <div
              style={{ backgroundColor: themeSettings.primaryColor }}
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-sm group-hover:scale-105 transition-transform"
            >
              A
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight block group-hover:text-blue-600 transition-colors">
                {themeSettings.siteName}
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase block -mt-0.5">
                {themeSettings.header?.subtitle || 'Astro • Sveltia • Edge'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Menu */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {headerMenu?.items?.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.url)}
                className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100/70 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {showSearch && (
              <button
                onClick={onOpenSearch}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-semibold"
                title="Search Content (Ctrl+K)"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search...</span>
                <kbd className="hidden sm:inline bg-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded">
                  /
                </kbd>
              </button>
            )}

            {/* Mobile Burger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {headerMenu?.items?.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.url);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
