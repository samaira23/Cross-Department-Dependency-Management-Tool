import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import GraphView from "./pages/GraphView";
import AdminDashboard from "./pages/AdminDashboard";
import "./styles/global.css";

const initialData = {
  departments: [
    { id: 1, name: "Dept 1" },
    { id: 2, name: "Dept 2" },
  ],
  users: [
    { id: 1, name: "User 1", department: 1 },
    { id: 2, name: "User 2", department: 2 },
  ],
  tasks: [
    { id: 1, name: "Task 1", department: 1 },
    { id: 2, name: "Task 2", department: 2 },
  ],
  dependencies: [
    { id: 1, from: 1, to: 2, link: "blocks" },
  ],
};

export default function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [data, setData] = useState(initialData);

  const handleLogin = (username) => {
    setUser(username);
    setPage("admin");
  };

  const handleLogout = () => {
    setUser(null);
    setPage("login");
  };

  return (
    <div className="app">
      {page === "login" && <LoginPage onLogin={handleLogin} />}
      {page === "admin" && (
        <AdminDashboard
          user={user}
          data={data}
          setData={setData}
          onLogout={handleLogout}
          onGraphView={() => setPage("graph")}
        />
      )}
      {page === "graph" && (
        <GraphView
          user={user}
          data={data}
          onLogout={handleLogout}
          onBack={() => setPage("admin")}
        />
      )}
    </div>
  );
}