import { Link } from 'react-router-dom';
import { posts, rebaseAsset } from '../posts';

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Home() {
  return (
    <section className="post-list">
      <h1 className="page-title">Posts</h1>
      <ul>
        {posts.map((p) => (
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
    </section>
  );
}
