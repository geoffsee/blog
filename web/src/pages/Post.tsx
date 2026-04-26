import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPost, posts, rebaseAsset } from '../posts';

function formatDate(iso: string): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('-').map(Number);
  const d =
    year && month && day ? new Date(year, month - 1, day) : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function Post() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPost(slug) : undefined;

  useEffect(() => {
    if (post) document.title = `${post.title} - blog`;
    return () => {
      document.title = 'Blog';
    };
  }, [post]);

  useEffect(() => {
    if (!post) return;

    let cancelled = false;
    const nodes = document.querySelectorAll<HTMLElement>('.post-body .mermaid');
    if (!nodes.length) return;

    void import('mermaid').then(({ default: mermaid }) => {
      if (cancelled) return;

      const styles = getComputedStyle(document.documentElement);
      const color = (name: string) => styles.getPropertyValue(name).trim();

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: {
          primaryColor: color('--paper-bright'),
          primaryTextColor: color('--ink'),
          primaryBorderColor: color('--rule'),
          lineColor: color('--accent-blue'),
          secondaryColor: color('--paper'),
          tertiaryColor: color('--paper-white'),
          fontFamily: 'Archivo, Helvetica, sans-serif',
        },
      });

      void mermaid.run({ nodes });
    });

    return () => {
      cancelled = true;
    };
  }, [post]);

  if (!post) {
    return (
      <section className="post-not-found">
        <h1>Post not found</h1>
        <p>
          That post does not exist. <Link to="/">Back to all posts</Link>.
        </p>
      </section>
    );
  }

  const relatedPosts = posts
    .filter((candidate) => candidate.slug !== post.slug)
    .filter((candidate) => {
      const postTerms = new Set([...(post.tags ?? []), ...(post.categories ?? [])]);
      return [...(candidate.tags ?? []), ...(candidate.categories ?? [])].some((term) =>
        postTerms.has(term),
      );
    })
    .slice(0, 3);

  const returnLink = (
    <Link to="/" className="return-link">
      <span aria-hidden="true">&larr;</span>
      Return to posts
    </Link>
  );

  return (
    <article className="post">
      <nav className="post-nav" aria-label="Post navigation">
        {returnLink}
      </nav>
      <header className="post-header">
        <h1>{post.title}</h1>
        <p className="post-meta">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {post.author ? <span className="author"> by {post.author}</span> : null}
        </p>
        {post.featured_image ? (
          <img className="post-hero" src={rebaseAsset(post.featured_image)} alt="" />
        ) : null}
      </header>
      <div className="post-body" dangerouslySetInnerHTML={{ __html: post.html }} />
      {relatedPosts.length ? (
        <section className="related-posts" aria-labelledby="related-posts-title">
          <p className="section-kicker">Related trajectories</p>
          <h2 id="related-posts-title">Related posts</h2>
          <div className="related-grid">
            {relatedPosts.map((related) => (
              <Link key={related.slug} to={`/posts/${related.slug}`} className="related-card">
                <time dateTime={related.date}>{formatDate(related.date)}</time>
                <span>{related.title}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <footer className="post-footer">
        {returnLink}
      </footer>
    </article>
  );
}
