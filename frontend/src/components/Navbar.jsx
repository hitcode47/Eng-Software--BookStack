import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <div>
        <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")} style={{ fontWeight: 700, fontSize: "1.1rem" }}>
          BookStack
        </NavLink>
      </div>
      <nav>
        <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>Home</NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>Meus Empréstimos</NavLink>
        <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>Admin</NavLink>
      </nav>
    </header>
  );
}
