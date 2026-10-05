import React from 'react';
import { Post, Category, HomepageSection, ThemeSettings, HeroSectionConfig } from '../../types/cms';
import { HeroSection } from './HeroSection';
import {
  Clock,
  User,
  ArrowRight,
  TrendingUp,
  Bookmark,
  Share2,
  Sparkles,
  ChevronRight,
  Send,
  CheckCircle,
} from 'lucide-react';

interface Props {
  posts: Post[];
  categories: Category[];
  sections: HomepageSection[];
  heroConfig?: HeroSectionConfig;
  themeSettings: ThemeSettings;
  onSelectPost: (post: Post) => void;
  onSelectCategory: (cat: Category) => void;
  onNavigate?: (path: string) => void;
}

export const HomepageView: React.FC<Props> = ({
  posts,
  categories,
  sections,
  heroConfig,
  themeSettings,
  onSelectPost,
  onSelectCategory,
  onNavigate,
}) => {
  const publishedPosts = posts.filter((p) => p.status === 'published');
  const heroPost = publishedPosts[0];
  const featuredPosts = publishedPosts.slice(1, 4);
  const latestPosts = publishedPosts.slice(0, 6);

  const [newsletterEmail, setNewsletterEmail] = React.useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = React.useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setTimeout(() => {
        setNewsletterEmail('');
        setNewsletterSubscribed(false);
      }, 4000);
    }
  };

  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Fully Editable Hero Section (Placed Above Featured Post Section) */}
      {heroConfig && heroConfig.enabled && (
        <HeroSection config={heroConfig} onNavigate={onNavigate} />
      )}

      {sortedSections.map((section) => {
        if (!section.enabled) return null;

        switch (section.type) {
          case 'hero':
            if (!heroPost) return null;
            return (
              <section key={section.id} className="relative pt-6">
                <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
                  {/* Background cover image with gradient overlay */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={
                        heroPost.featuredImage ||
                        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80'
                      }
                      alt={heroPost.title}
                      className="w-full h-full object-cover opacity-25 scale-105 transition-transform duration-700 hover:scale-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
                  </div>

                  <div className="relative z-10 p-6 sm:p-10 md:p-16 max-w-4xl space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        style={{ backgroundColor: themeSettings.primaryColor }}
                        className="text-xs uppercase font-extrabold tracking-wider text-white px-3 py-1 rounded-full shadow-xs"
                      >
                        {heroPost.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium bg-white/10 backdrop-blur-md px-3 py-1 rounded-full">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{heroPost.readingTime} min read</span>
                      </div>
                      <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Featured Story</span>
                      </span>
                    </div>

                    <h1
                      onClick={() => onSelectPost(heroPost)}
                      className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight cursor-pointer hover:text-blue-300 transition-colors font-serif-custom"
                    >
                      {heroPost.title}
                    </h1>

                    <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed line-clamp-3">
                      {heroPost.excerpt}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-white/10">
                      <div className="flex items-center gap-3">
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                          alt={heroPost.author}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20"
                        />
                        <div>
                          <span className="block text-sm font-bold text-white">{heroPost.author}</span>
                          <span className="text-xs text-slate-400">
                            {new Date(heroPost.pubDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectPost(heroPost)}
                        style={{ backgroundColor: themeSettings.primaryColor }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-95 transition-all shadow-md"
                      >
                        <span>Read Full Story</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            );

          case 'category-showcase':
            return (
              <section key={section.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                      {section.title || 'Explore by Topic'}
                    </h2>
                    {section.subtitle && (
                      <p className="text-xs md:text-sm text-slate-500 mt-0.5">{section.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {categories.map((cat) => {
                    const count = publishedPosts.filter((p) => {
                      const pCat = (p.category || '').trim().toLowerCase();
                      return pCat === (cat.name || '').trim().toLowerCase() || pCat === (cat.slug || '').trim().toLowerCase() || pCat === cat.id;
                    }).length;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => onSelectCategory(cat)}
                        className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 hover:border-blue-500 hover:shadow-md transition-all space-y-2"
                      >
                        <div
                          className="h-2 w-8 rounded-full transition-all group-hover:w-12"
                          style={{ backgroundColor: cat.color || themeSettings.primaryColor }}
                        />
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-slate-500">{count} {count === 1 ? 'article' : 'articles'}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            );

          case 'featured-grid':
            return (
              <section key={section.id} className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Curated Selection</span>
                  </div>
                  <h2 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {section.title || 'Featured Stories & Architecture Guides'}
                  </h2>
                  {section.subtitle && (
                    <p className="text-xs md:text-sm text-slate-500 mt-1">{section.subtitle}</p>
                  )}
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {featuredPosts.map((post) => (
                    <article
                      key={post.id}
                      onClick={() => onSelectPost(post)}
                      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col h-full"
                    >
                      <div className="aspect-16/10 w-full overflow-hidden bg-slate-100 relative shrink-0">
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 p-4 text-center">
                            <Sparkles className="h-8 w-8 mb-1 opacity-40 text-blue-500" />
                            <span className="text-[11px] font-bold text-slate-500">{post.category}</span>
                          </div>
                        )}
                        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-slate-900 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs">
                          {post.category}
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{new Date(post.pubDate).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{post.readingTime} min read</span>
                          </div>
                          <h3 className="font-bold text-base md:text-lg text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-xs md:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-slate-800">{post.author}</span>
                          <span className="text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            Read <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );

          case 'latest-posts':
            return (
              <section key={section.id} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {section.title || 'Latest Dispatches & Insights'}
                    </h2>
                    {section.subtitle && (
                      <p className="text-xs md:text-sm text-slate-500 mt-1">{section.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {latestPosts.map((post) => (
                    <article
                      key={post.id}
                      onClick={() => onSelectPost(post)}
                      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-blue-400 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                    >
                      <div className="w-full sm:w-44 aspect-16/10 sm:aspect-square sm:h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                        {post.featuredImage ? (
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 p-2 text-center">
                            <Sparkles className="h-6 w-6 mb-1 opacity-40 text-blue-500" />
                            <span className="text-[10px] font-bold text-slate-500">{post.category}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-between space-y-2 w-full">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <span className="font-bold text-blue-600">{post.category}</span>
                            <span>•</span>
                            <span>{post.readingTime} min read</span>
                          </div>
                          <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                            {post.title}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                          <span>{post.author}</span>
                          <span>{new Date(post.pubDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );

          case 'newsletter':
            return (
              <section key={section.id} className="relative overflow-hidden rounded-3xl bg-blue-600 text-white p-8 md:p-12 shadow-xl">
                <div className="max-w-2xl mx-auto text-center space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full text-white">
                    Weekly Editorial Dispatch
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                    {section.title || 'Stay Ahead of the Headless Frontier'}
                  </h2>
                  <p className="text-sm md:text-base text-blue-100 leading-relaxed">
                    {section.subtitle ||
                      'Get curations of Astro architecture, Sveltia CMS integrations, and Gutenberg patterns delivered directly to your inbox.'}
                  </p>

                  <form onSubmit={handleSubscribe} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your work email address"
                      className="flex-1 px-4 py-3 rounded-xl bg-white text-slate-900 placeholder-slate-400 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      {newsletterSubscribed ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span>Joined!</span>
                        </>
                      ) : (
                        <>
                          <span>Subscribe</span>
                          <Send className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                  <p className="text-[11px] text-blue-200">Zero spam. Unsubscribe at any time with one click.</p>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};
