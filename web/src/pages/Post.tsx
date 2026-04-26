import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPost, rebaseAsset } from '../posts';

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
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

  return (
    <article className="post">
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
      <footer className="post-footer">
        <Link to="/" className="read-more">
          &larr; All posts
        </Link>
      </footer>
    </article>
  );
}
