import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="app">
      <header className="site-header">
        <Link to="/" className="brand">
          <span className="brand-mark">&gt;_</span>
          <span className="brand-name">blog</span>
        </Link>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <span>&copy; {new Date().getFullYear()}</span>
        <span>&middot;</span>
        <a href="https://github.com/geoffsee/blog" target="_blank" rel="noreferrer">
          source on github
        </a>
      </footer>
    </div>
  );
}
