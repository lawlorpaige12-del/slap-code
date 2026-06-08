import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <section className="section-grid" aria-label="Page not found">
      <div className="card">
        <h1 className="page-title">Page Not Found</h1>
        <p>The page you are looking for does not exist. Use the navigation or return home.</p>
        <Link className="submit-button" to="/">Return Home</Link>
      </div>
    </section>
  );
}

export default NotFound;
