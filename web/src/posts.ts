import fm from 'front-matter';
import { Renderer, marked } from 'marked';
import type { Tokens } from 'marked';

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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createMarkdownRenderer(): Renderer {
  const renderer = new Renderer();
  const renderCode = renderer.code.bind(renderer);
  const headingCounts = new Map<string, number>();

  renderer.code = (token: Tokens.Code): string => {
    const language = token.lang?.trim().split(/\s+/)[0];
    if (language === 'mermaid') {
      return `<figure class="mermaid-figure"><div class="mermaid">${escapeHtml(
        token.text,
      )}</div></figure>`;
    }

    return renderCode(token);
  };

  renderer.heading = (token: Tokens.Heading): string => {
    const html = renderer.parser.parseInline(token.tokens);
    const baseSlug = slugifyHeading(token.text) || 'section';
    const count = headingCounts.get(baseSlug) ?? 0;
    headingCounts.set(baseSlug, count + 1);
    const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`;

    return `<h${token.depth} id="${slug}">${html}</h${token.depth}>`;
  };

  return renderer;
}

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

function normalizeDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value ?? '');
}

function dateTime(value: string): number {
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(time) ? 0 : time;
}

function toPost(path: string, source: string): Post {
  const { attributes, body } = fm<Partial<PostMeta>>(source);
  const filename = path.split('/').pop()!;
  const slug = slugFromPath(path);
  const html = rebaseAssetPaths(
    marked.parse(body, { async: false, renderer: createMarkdownRenderer() }) as string,
  );
  return {
    slug,
    filename,
    title: attributes.title ?? slug,
    date: normalizeDate(attributes.date),
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
  .sort((a, b) => dateTime(b.date) - dateTime(a.date));

export const getPost = (slug: string): Post | undefined =>
  posts.find((p) => p.slug === slug);

export function rebaseAsset(path: string | undefined): string | undefined {
  if (!path) return path;
  if (path.startsWith('/assets/')) return `${BASE}${path.slice(1)}`;
  return path;
}
