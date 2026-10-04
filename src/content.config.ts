import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Amit Singh'),
    category: z.string().default('Technology'),
    tags: z.array(z.string()).default([]),
    featuredImage: z.string().optional(),
    excerpt: z.string().default(''),
    readingTime: z.number().default(5),
    template: z.enum(['standard', 'cover-hero', 'minimal-editorial', 'sidebar-right']).default('standard'),
    draft: z.boolean().default(false),
    status: z.string().optional(),
    blocks: z.array(z.any()).optional(),
    seo: z.object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      focusKeyword: z.string().optional(),
      canonicalUrl: z.string().optional(),
      robotsIndex: z.boolean().default(true),
      robotsFollow: z.boolean().default(true),
      ogImage: z.string().optional(),
    }).optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    template: z.enum(['default', 'full-width', 'contact', 'about', 'landing']).default('default'),
    draft: z.boolean().default(false),
    blocks: z.array(z.any()).optional(),
  }),
});

export const collections = {
  posts,
  pages,
};
