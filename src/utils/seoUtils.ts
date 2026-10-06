import { IndexingSettings, Post, Page, Category, Tag } from '../types/cms';

export interface RouteInfo {
  type: 'home' | 'post' | 'page' | 'archive' | 'search';
  pageNum?: number;
  post?: Post;
  page?: Page;
  archiveType?: 'category' | 'tag';
  item?: Category | Tag;
}

export function calculateRobotsDirective(
  route: RouteInfo,
  indexingSettings?: IndexingSettings
): string {
  // Safe defaults
  const globalIndexing = indexingSettings?.globalIndexing ?? true;
  const postsIndexing = indexingSettings?.postsIndexing ?? true;
  const pagesIndexing = indexingSettings?.pagesIndexing ?? true;
  const categoriesIndexing = indexingSettings?.categoriesIndexing ?? false;
  const tagsIndexing = indexingSettings?.tagsIndexing ?? false;
  const paginationPagesIndexing =
    indexingSettings?.paginationPagesIndexing ?? indexingSettings?.paginationIndexing ?? false;
  const searchResultsIndexing = indexingSettings?.searchResultsIndexing ?? false;

  // Level A: Global Search Indexing Master Switch
  if (!globalIndexing) {
    return 'noindex, follow';
  }

  // Level B: Content-Type Specific Indexing
  if (route.type === 'home') {
    // If it's a paginated homepage route (/page2/, /page3/, etc.)
    if (route.pageNum && route.pageNum > 1) {
      return paginationPagesIndexing ? 'index, follow' : 'noindex, follow';
    }
    // Main Homepage (/)
    return 'index, follow';
  }

  if (route.type === 'post') {
    if (route.post?.seo?.robotsIndex === false) {
      return 'noindex, follow';
    }
    return postsIndexing ? 'index, follow' : 'noindex, follow';
  }

  if (route.type === 'page') {
    if (route.page?.seo?.robotsIndex === false) {
      return 'noindex, follow';
    }
    return pagesIndexing ? 'index, follow' : 'noindex, follow';
  }

  if (route.type === 'archive') {
    if (route.archiveType === 'category') {
      return categoriesIndexing ? 'index, follow' : 'noindex, follow';
    }
    if (route.archiveType === 'tag') {
      return tagsIndexing ? 'index, follow' : 'noindex, follow';
    }
  }

  if (route.type === 'search') {
    return searchResultsIndexing ? 'index, follow' : 'noindex, follow';
  }

  return 'index, follow';
}
