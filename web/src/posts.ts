import fm from 'front-matter';
import { marked } from 'marked';

export type PostMeta = {
  slug: string;
  filename: string;
  title: string;
  date: string;
  author?: string;
  excerpt?: string;
  tags?: string[];
  categories?: string[];
  featured_image?: string;
  published?: boolean;
};

export type Post = PostMeta & {
  html: string;
  body: string;
};

const raw = import.meta.glob('../../posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const BASE = import.meta.env.BASE_URL;

function rebaseAssetPaths(html: string): string {
  // Markdown references images as /assets/images/foo.png. When the site is
  // hosted under a sub-path (e.g. /blog/) those need to be prefixed so the
  // browser resolves them under the deployed base path.
  return html.replaceAll('"/assets/', `"${BASE}assets/`);
}

function slugFromPath(path: string): string {
  const base = path.split('/').pop()!.replace(/\.md$/, '');
  // strip leading YYYY-MM-DD- so URLs read cleanly
  return base.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function toPost(path: string, source: string): Post {
  const { attributes, body } = fm<Partial<PostMeta>>(source);
  const filename = path.split('/').pop()!;
  const slug = slugFromPath(path);
  const html = rebaseAssetPaths(marked.parse(body, { async: false }) as string);
  return {
    slug,
    filename,
    title: attributes.title ?? slug,
    date: String(attributes.date ?? ''),
    author: attributes.author,
    excerpt: attributes.excerpt,
    tags: attributes.tags,
    categories: attributes.categories,
    featured_image: attributes.featured_image,
    published: attributes.published,
    html,
    body,
  };
}

export const posts: Post[] = Object.entries(raw)
  .map(([path, source]) => toPost(path, source))
  .filter((p) => p.published !== false)
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export const getPost = (slug: string): Post | undefined =>
  posts.find((p) => p.slug === slug);

export function rebaseAsset(path: string | undefined): string | undefined {
  if (!path) return path;
  if (path.startsWith('/assets/')) return `${BASE}${path.slice(1)}`;
  return path;
}
