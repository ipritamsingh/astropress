export type PostStatus = 'published' | 'draft' | 'scheduled' | 'trash';

export type BlockType = 
  | 'paragraph'
  | 'heading'
  | 'quote'
  | 'code'
  | 'list'
  | 'image'
  | 'gallery'
  | 'columns'
  | 'button'
  | 'accordion'
  | 'author-box'
  | 'alert'
  | 'divider'
  | 'spacer'
  | 'embed'
  | 'table'
  | 'download-button';

export interface GutenbergBlock {
  id: string;
  type: BlockType;
  content: string; // Text or HTML or JSON data
  settings: {
    level?: 1 | 2 | 3 | 4 | 5 | 6; // for heading
    align?: 'left' | 'center' | 'right' | 'justify';
    fontSize?: 'small' | 'medium' | 'large' | 'huge';
    fontWeight?: 'normal' | 'medium' | 'bold' | 'extrabold';
    textColor?: string;
    backgroundColor?: string;
    borderRadius?: string;
    padding?: string;
    imageUrl?: string;
    imageAlt?: string;
    imageCaption?: string;
    buttonUrl?: string;
    buttonStyle?: 'primary' | 'secondary' | 'outline';
    columnLayout?: '50-50' | '33-33-33' | '70-30';
    columns?: { id: string; content: string }[];
    alertType?: 'info' | 'warning' | 'success' | 'danger';
    codeLanguage?: string;
    accordionItems?: { title: string; content: string }[];
    customClasses?: string;
    tableData?: {
      headers: string[];
      rows: string[][];
      caption?: string;
      alignments?: ('left' | 'center' | 'right')[];
      hasHeader?: boolean;
    };
    downloadUrl?: string;
    downloadText?: string;
    downloadFileName?: string;
    downloadOpenInNewTab?: boolean;
    downloadAlignment?: 'left' | 'center' | 'right';
  };
}

export interface PostSEO {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonicalUrl?: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  ogImage?: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  originalSlug?: string;
  filePath?: string;
  pubDate: string; // ISO string
  updatedDate?: string;
  status: PostStatus;
  author: string;
  category: string;
  tags: string[];
  featuredImage: string;
  excerpt: string;
  readingTime: number;
  template: 'standard' | 'cover-hero' | 'minimal-editorial' | 'sidebar-right';
  blocks: GutenbergBlock[];
  body: string; // Markdown fallback / raw content
  seo: PostSEO;
  views?: number;
  deletedAt?: string;
  originalStatus?: PostStatus;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  originalSlug?: string;
  filePath?: string;
  status: PostStatus;
  template: 'default' | 'full-width' | 'contact' | 'about' | 'landing';
  parent?: string;
  featuredImage?: string;
  blocks: GutenbergBlock[];
  body: string;
  seo: PostSEO;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  postCount?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  postCount?: number;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  email: string;
  role: string;
  avatar: string;
  bio: string;
  twitter?: string;
  github?: string;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  originalUrl?: string;
  type: 'image' | 'video' | 'document';
  format?: 'webp' | 'jpeg' | 'png' | 'svg' | 'gif' | 'other';
  size: string; // e.g. "145 KB"
  originalSize?: string; // e.g. "420 KB"
  savingsPercentage?: number; // e.g. 65
  isWebpConverted?: boolean;
  dimensions?: string; // e.g. "1920x1080"
  uploadDate: string;
  altText: string;
  caption?: string;
}

export interface HeroTrustBadge {
  id: string;
  label: string;
  sublabel?: string;
  iconName?: 'star' | 'shield' | 'zap' | 'git' | 'cpu' | 'users' | 'sparkles' | 'check';
  badgeType?: 'rating' | 'counter' | 'pill' | 'text';
}

export interface HeroSectionConfig {
  enabled: boolean;
  
  // Eyebrow
  showEyebrow: boolean;
  eyebrowText: string;
  eyebrowIcon: 'sparkles' | 'zap' | 'rocket' | 'code' | 'star' | 'none';
  eyebrowBgColor?: string;
  eyebrowTextColor?: string;
  
  // Heading & Highlights
  heading: string;
  headingHighlight: string;
  headingHighlightType: 'gradient' | 'solid' | 'underline' | 'badge';
  headingHighlightColor: string; // e.g. "from-blue-600 to-indigo-600" or "#2563eb"
  
  // Typography
  headingSize: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  headingWeight: 'normal' | 'semibold' | 'bold' | 'extrabold' | 'black';
  lineHeight: 'tight' | 'snug' | 'normal' | 'relaxed';
  alignment: 'left' | 'center' | 'right';
  
  // Supporting Description
  showDescription: boolean;
  description: string;
  descriptionSize: 'sm' | 'base' | 'lg' | 'xl';
  descriptionColor?: string;
  
  // Action Buttons
  showPrimaryButton: boolean;
  primaryButtonText: string;
  primaryButtonUrl: string;
  primaryButtonBgColor?: string;
  primaryButtonTextColor?: string;
  primaryButtonStyle: 'filled' | 'gradient' | 'glow' | 'pill';
  
  showSecondaryButton: boolean;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  secondaryButtonStyle: 'outline' | 'glass' | 'ghost' | 'subtle';
  
  // Trust Badges & Social Proof
  showTrustBadges: boolean;
  trustBadgesTitle?: string;
  trustBadges: HeroTrustBadge[];
  
  // SVG Illustration & Visuals
  showIllustration: boolean;
  illustrationType: 'default-svg' | 'custom-svg' | 'code-window' | 'floating-cards';
  customSvgContent?: string;
  svgAccentColor: string; // Primary accent
  svgSecondaryColor: string; // Secondary accent
  illustrationPosition: 'right' | 'left' | 'bottom';
  illustrationSize: 'compact' | 'medium' | 'large' | 'full';
  
  // Layout, Background & Spacing
  backgroundType: 'gradient-subtle' | 'gradient-mesh' | 'solid' | 'dark-slate' | 'pure-white' | 'grid-pattern';
  backgroundColor: string;
  gradientFrom: string;
  gradientTo: string;
  textColor: string;
  accentColor: string;
  paddingY: 'compact' | 'normal' | 'spacious' | 'luxurious';
  containerWidth: 'narrow' | 'normal' | 'wide' | 'full';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  
  // Responsive display controls
  mobileStackOrder: 'text-first' | 'illustration-first';
  hideIllustrationOnMobile: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  postTitle: string;
  authorName: string;
  authorEmail: string;
  authorAvatar: string;
  content: string;
  date: string;
  status: 'approved' | 'pending' | 'spam' | 'trash';
  replies?: {
    id: string;
    authorName: string;
    content: string;
    date: string;
  }[];
}

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  target?: '_self' | '_blank';
  children?: MenuItem[];
}

export interface Menu {
  id: string;
  name: string;
  location: 'header' | 'footer' | 'mobile';
  items: MenuItem[];
}

export type SectionType = 
  | 'hero' 
  | 'featured-grid' 
  | 'latest-posts' 
  | 'category-showcase' 
  | 'newsletter' 
  | 'cta' 
  | 'testimonials' 
  | 'faq'
  | 'custom-html'
  | 'brand-logos';

export interface HomepageSection {
  id: string;
  type: SectionType;
  title: string;
  subtitle?: string;
  enabled: boolean;
  order: number;
  itemCount?: number;
  columns?: 1 | 2 | 3 | 4 | 5;
  categoryFilter?: string;
  tagFilter?: string;
  sortBy?: 'latest' | 'views' | 'title';
  aspectRatio?: '16:9' | '16:10' | '4:3' | '1:1' | 'original';
  imageFit?: 'cover' | 'contain';
  layout?: string;
  backgroundColor?: string;
  textColor?: string;
  customContent?: string;
  buttonText?: string;
  buttonUrl?: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  slug: string;
  layout: 'standard' | 'full-width' | 'sidebar-right' | 'sidebar-left' | 'minimal';
  showFeaturedImage: boolean;
  imageAspectRatio: '16:9' | '16:10' | '4:3' | '1:1' | 'original';
  showAuthorBio: boolean;
  showReadingTime: boolean;
  showPublishDate: boolean;
  showCategoryBadge: boolean;
  showTags: boolean;
  showShareButtons: boolean;
  showRelatedPosts: boolean;
  showComments: boolean;
  showBreadcrumbs: boolean;
  customCss?: string;
}

export interface CommunityLink {
  id: string;
  platform: 'telegram' | 'whatsapp' | 'youtube' | 'twitter' | 'discord' | 'custom';
  label: string;
  url: string;
  enabled: boolean;
  order: number;
}

export interface NewsletterSettings {
  enabled: boolean;
  title: string;
  subtitle: string;
  placeholderText: string;
  buttonText: string;
  successMessage: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  subscribedAt: string;
}

export interface IndexingSettings {
  globalIndexing: boolean;
  postsIndexing: boolean;
  pagesIndexing: boolean;
  categoriesIndexing: boolean;
  tagsIndexing: boolean;
  paginationPagesIndexing: boolean;
  paginationIndexing?: boolean;
  searchResultsIndexing: boolean;
}

export interface SeoSocialProfiles {
  twitterHandle?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export interface SiteSettings {
  siteTitle: string;
  siteTagline: string;
  siteDescription: string;
  siteUrl: string;
  focusKeyword?: string;
  logoUrl?: string;
  faviconUrl?: string;
  defaultOgImage?: string;
  seoSocialProfiles?: SeoSocialProfiles;
  permalinkStructure:
    | '/%postname%/'
    | '/posts/%postname%/'
    | '/%year%/%month%/%day%/%postname%/'
    | '/%year%/%month%/%postname%/'
    | '/archives/%post_id%/'
    | string;
  pagePermalinkStructure?:
    | '/%pagename%/'
    | '/pages/%pagename%/'
    | string;
  postsPerPage: number;
  commentsAutoApprove: boolean;
  customHeadCode?: string;
  customFooterCode?: string;
  customGlobalCss?: string;
  indexingSettings?: IndexingSettings;
  communityCtaEnabled?: boolean;
  communityCtaTitle?: string;
  communityCtaSubtitle?: string;
  communityLinks?: CommunityLink[];
  newsletterSettings?: NewsletterSettings;
}

export interface FooterSocialLink {
  id: string;
  platform:
    | 'instagram'
    | 'facebook'
    | 'youtube'
    | 'telegram'
    | 'whatsapp'
    | 'twitter'
    | 'x'
    | 'linkedin'
    | 'github'
    | 'discord'
    | 'pinterest'
    | 'tiktok'
    | 'threads'
    | 'reddit'
    | 'snapchat'
    | 'medium'
    | 'custom'
    | 'globe'
    | string;
  url: string;
  label: string;
  username?: string;
  enabled: boolean;
  order?: number;
  useCustomUrl?: boolean;
}

export interface FooterLegalLink {
  id: string;
  label: string;
  url: string;
  enabled?: boolean;
}

export interface FooterConfig {
  columns: number;
  layout?: 'standard' | 'stacked' | 'split' | 'minimal';
  style?: 'dark' | 'midnight' | 'light' | 'subtle';
  containerWidth?: 'narrow' | 'normal' | 'wide' | 'full';
  paddingY?: 'compact' | 'normal' | 'spacious';
  backgroundColor?: string;
  textColor?: string;
  
  // Site Branding column
  showBrandCol?: boolean;
  brandTitle?: string;
  brandDescription?: string;
  showBrandLogo?: boolean;
  
  // Navigation column
  navTitle?: string;
  menuLocation?: string;
  maxNavLinks?: number;
  
  // Categories/Topics column
  categoriesTitle?: string;
  categoriesStyle?: 'badges' | 'list';
  maxCategories?: number;
  showTechStackBadges?: boolean;
  techStackBadgesText?: string;
  
  // Newsletter column
  showNewsletter: boolean;
  newsletterTitle: string;
  newsletterSubtitle: string;
  newsletterPlaceholder?: string;
  newsletterButtonText?: string;
  newsletterSuccessMsg?: string;
  newsletterDisclaimer?: string;
  
  // Social Links
  showSocialLinks: boolean;
  socialLinks?: FooterSocialLink[];
  
  // Bottom Bar / Sub-Footer
  copyright: string;
  customCredits?: string;
  showBackToTop?: boolean;
  showLegalLinks?: boolean;
  legalLinks?: FooterLegalLink[];
  bottomBarAlignment?: 'split' | 'center' | 'stacked';
}

export interface ThemeSettings {
  siteName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  containerWidth: 'narrow' | 'normal' | 'wide' | 'full';
  darkMode: boolean;
  customCss?: string;
  header: {
    layout: 'standard' | 'centered' | 'split';
    sticky: boolean;
    transparentOnHome?: boolean;
    showSearch: boolean;
    showCta: boolean;
    ctaText: string;
    ctaUrl: string;
    showSocialLinks?: boolean;
    subtitle?: string;
  };
  footer: FooterConfig;
}

export interface GitCommitRecord {
  id: string;
  timestamp: string;
  message: string;
  author: string;
  branch: string;
  status: 'synced' | 'pending';
}

export interface DeploymentSettings {
  githubRepo: string;
  githubBranch: string;
  githubToken?: string;
  cloudflareWorkerUrl: string;
  cloudflarePagesProject: string;
  productionUrl: string;
  autoDeployOnPublish: boolean;
}
