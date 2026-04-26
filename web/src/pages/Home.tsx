import { useMemo, useState } from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiNpm, SiRust } from 'react-icons/si';
import { Link } from 'react-router-dom';
import TagCloud from '../components/TagCloud';
import { posts, rebaseAsset } from '../posts';

function formatDate(iso: string): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('-').map(Number);
  const d =
    year && month && day ? new Date(year, month - 1, day) : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Home() {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const filteredPosts = useMemo(() => {
    if (!normalizedQuery) return posts;

    return posts.filter((p) => {
      const searchable = [
        p.title,
        p.excerpt,
        p.author,
        p.date,
        ...(p.tags ?? []),
        ...(p.categories ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  return (
    <section className="post-list">
      <div className="index-header">
        <p className="section-kicker">Latest</p>
        <h1 className="page-title">Blog</h1>
        <nav className="index-links" aria-label="External profiles">
          <a href="https://github.com/geoffsee" target="_blank" rel="noreferrer" aria-label="GitHub">
            <FaGithub aria-hidden="true" />
          </a>
          <a
            href="https://www.linkedin.com/in/geoffsee"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
          >
            <FaLinkedin aria-hidden="true" />
          </a>
          <a href="https://www.npmjs.com/~geoffsee" target="_blank" rel="noreferrer" aria-label="NPM">
            <SiNpm aria-hidden="true" />
          </a>
          <a
            href="https://crates.io/users/geoffsee"
            target="_blank"
            rel="noreferrer"
            aria-label="Crates.io"
          >
            <SiRust aria-hidden="true" />
          </a>
        </nav>
      </div>
      <TagCloud posts={posts} onSelectTag={setQuery} />
      <label className="search-field">
        <span>Search posts</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, date, tag, or summary"
        />
      </label>
      <p className="search-count" aria-live="polite">
        {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
        {normalizedQuery ? ` matching "${query.trim()}"` : ''}
      </p>
      <ul>
        {filteredPosts.map((p) => (
          <li key={p.slug} className="post-card">
            {p.featured_image ? (
              <Link to={`/posts/${p.slug}`} className="post-card-thumb">
                <img src={rebaseAsset(p.featured_image)} alt="" loading="lazy" />
              </Link>
            ) : null}
            <div className="post-card-body">
              <h2>
                <Link to={`/posts/${p.slug}`}>{p.title}</Link>
              </h2>
              <p className="post-meta">
                <time dateTime={p.date}>{formatDate(p.date)}</time>
                {p.tags?.length ? (
                  <span className="tags">
                    {p.tags.map((t) => (
                      <span key={t} className="tag">
                        {t}
                      </span>
                    ))}
                  </span>
                ) : null}
              </p>
              {p.excerpt ? <p className="post-excerpt">{p.excerpt}</p> : null}
              <Link to={`/posts/${p.slug}`} className="read-more">
                Read &rarr;
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {!filteredPosts.length ? (
        <p className="empty-state">No posts matched that search.</p>
      ) : null}
    </section>
  );
}
