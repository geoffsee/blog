import { type CSSProperties, useMemo } from 'react';
import type { Post } from '../posts';

type TagCloudProps = {
  posts: Post[];
  onSelectTag: (tag: string) => void;
};

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export default function TagCloud({ posts, onSelectTag }: TagCloudProps) {
  const tagCloud = useMemo(() => {
    const tags = new Map<string, { label: string; count: number }>();

    posts.forEach((post) => {
      post.tags?.forEach((tag) => {
        const key = normalizeTag(tag);
        if (!key) return;

        const existing = tags.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          tags.set(key, { label: tag, count: 1 });
        }
      });
    });

    const values = [...tags.values()].sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    });

    if (!values.length) return [];

    const counts = values.map((tag) => tag.count);
    const min = Math.min(...counts);
    const max = Math.max(...counts);

    return values.map((tag, index) => {
      const emphasis = max === min ? 0.45 : (tag.count - min) / (max - min);
      return {
        ...tag,
        emphasis,
        offset: ((index % 5) - 2) * 0.24,
        rotate: [-2, 1, -1, 2, 0][index % 5],
      };
    });
  }, [posts]);

  if (!tagCloud.length) return null;

  return (
    <section className="tag-cloud" aria-label="Tag cloud">
      {tagCloud.map((tag) => (
        <button
          key={normalizeTag(tag.label)}
          type="button"
          className="tag-cloud-word"
          style={
            {
              '--tag-emphasis': tag.emphasis,
              '--tag-offset': `${tag.offset}rem`,
              '--tag-rotate': `${tag.rotate}deg`,
            } as CSSProperties
          }
          onClick={() => onSelectTag(tag.label)}
          aria-label={`${tag.label}, ${tag.count} ${
            tag.count === 1 ? 'post' : 'posts'
          }`}
        >
          {tag.label}
        </button>
      ))}
    </section>
  );
}
