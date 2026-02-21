import "./Navbar.css";

export default function Navbar({ user, onLogout, onGraphView, currentPage }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand-group">
        <div className="navbar-brand">C D D M</div>
        <div className="navbar-sub">Editable Company Name</div>
      </div>

      <div className="navbar-right">
        <button
          className={`nav-link ${currentPage === "graph" ? "nav-link--active" : ""}`}
          onClick={onGraphView}
        >
          {currentPage === "graph" ? "Admin" : "Graph View"}
        </button>
        <button className="nav-link" onClick={onLogout}>
          Logout
        </button>
        <div className="nav-avatar" title={user}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20v-1a8 8 0 0116 0v1" />
          </svg>
        </div>
      </div>
    </nav>
  );
}