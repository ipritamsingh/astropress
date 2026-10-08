import React from 'react';
import { SinglePageView } from './SinglePageView';
import { Page } from '../../types/cms';

interface WrapperProps {
  page: Page;
}

export const SinglePageViewWrapper: React.FC<WrapperProps> = (props) => {
  const handleBack = () => {
    window.location.href = '/';
  };

  const handleEditPage = (page: Page) => {
    window.location.href = `/wpadmin/?editPage=${page.id}`;
  };

  return (
    <SinglePageView
      {...props}
      onBack={handleBack}
      onEditPage={handleEditPage}
    />
  );
};
