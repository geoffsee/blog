import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="post-not-found">
      <h1>404</h1>
      <p>
        Nothing here. <Link to="/">Back home</Link>.
      </p>
    </section>
  );
}
