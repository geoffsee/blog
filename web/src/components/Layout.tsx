import { FaGithub } from 'react-icons/fa';
import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="app">
      <header className="site-header">
        <Link to="/" className="brand">
          <img
            className="brand-avatar"
            src="https://github.com/geoffsee.png?size=96"
            alt=""
            width="32"
            height="32"
          />
          <span className="brand-name">Geoff Seemueller</span>
        </Link>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-links">
          <span>&copy; {new Date().getFullYear()}</span>
          <span>&middot;</span>
          <a
            href="https://github.com/geoffsee/blog"
            target="_blank"
            rel="noreferrer"
            aria-label="Source on GitHub"
            title="Source on GitHub"
          >
            <FaGithub aria-hidden="true" />
          </a>
        </div>
      </footer>
    </div>
  );
}
