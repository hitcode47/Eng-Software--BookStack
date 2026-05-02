import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import AdminBooks from "./components/AdminBooks";

const API_URL = "http://localhost:5173";
const CURRENT_USER_ID = 1;
const LIBRARIAN_USER_ID = 1;

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="page-container">
          <Routes>
            <Route path="/" element={<Home apiUrl={API_URL} userId={CURRENT_USER_ID} />} />
            <Route
              path="/dashboard"
              element={<Dashboard apiUrl={API_URL} userId={CURRENT_USER_ID} />}
            />
            <Route
              path="/admin"
              element={<AdminBooks apiUrl={API_URL} librarianId={LIBRARIAN_USER_ID} />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
