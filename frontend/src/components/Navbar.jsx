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
        <NavLink to="/login-user" className={({ isActive }) => (isActive ? "active" : "")}>User Login</NavLink>
        <NavLink to="/login-adm" className={({ isActive }) => (isActive ? "active" : "")}>Admin Login</NavLink>
      </nav>
    </header>
  );
}
