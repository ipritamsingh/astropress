import React from 'react';
import { WebsiteFooter } from './WebsiteFooter';
import { ThemeSettings, SiteSettings, Menu, Category } from '../../types/cms';

interface WrapperProps {
  themeSettings: ThemeSettings;
  siteSettings?: SiteSettings;
  menus: Menu[];
  categories: Category[];
}

export const WebsiteFooterWrapper: React.FC<WrapperProps> = (props) => {
  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <WebsiteFooter
      {...props}
      onNavigate={handleNavigate}
    />
  );
};
