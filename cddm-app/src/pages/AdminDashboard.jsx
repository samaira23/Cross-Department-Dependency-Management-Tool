import { useState } from "react";
import Navbar from "../components/navbar";
import "./AdminDashboard.css";

function ChevronIcon({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="2" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="5" y="2" width="6" height="2" rx="0.5" fill="currentColor" />
      <rect x="1" y="6" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="5" y="6" width="6" height="2" rx="0.5" fill="currentColor" />
    </svg>
  );
}

export default function AdminDashboard({ user, data, setData, onLogout, onGraphView }) {
  const [openSections, setOpenSections] = useState({
    departments: true, users: true, tasks: true, dependencies: true,
  });
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState({});
  const [editMode, setEditMode] = useState(false);

  const toggleSection = (s) => setOpenSections((prev) => ({ ...prev, [s]: !prev[s] }));

  const selectItem = (type, id) => {
    setSelected({ type, id });
    setEditMode(false);
    if (type === "user") {
      const item = data.users.find((u) => u.id === id);
      setDetail({ name: item.name, department: item.department });
    } else if (type === "task") {
      const item = data.tasks.find((t) => t.id === id);
      setDetail({ name: item.name, department: item.department });
    } else if (type === "department") {
      const item = data.departments.find((d) => d.id === id);
      setDetail({ name: item.name });
    } else if (type === "dependency") {
      const item = data.dependencies.find((d) => d.id === id);
      setDetail({ from: item.from, to: item.to, link: item.link });
    }
  };

  const handleSave = () => {
    if (selected.type === "user") {
      setData((d) => ({ ...d, users: d.users.map((u) => u.id === selected.id ? { ...u, ...detail } : u) }));
    } else if (selected.type === "task") {
      setData((d) => ({ ...d, tasks: d.tasks.map((t) => t.id === selected.id ? { ...t, ...detail } : t) }));
    } else if (selected.type === "department") {
      setData((d) => ({ ...d, departments: d.departments.map((dep) => dep.id === selected.id ? { ...dep, ...detail } : dep) }));
    } else if (selected.type === "dependency") {
      setData((d) => ({ ...d, dependencies: d.dependencies.map((dep) => dep.id === selected.id ? { ...dep, ...detail } : dep) }));
    }
    setEditMode(false);
  };

  const handleDelete = () => {
    if (selected.type === "user") {
      setData((d) => ({ ...d, users: d.users.filter((u) => u.id !== selected.id) }));
    } else if (selected.type === "task") {
      setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== selected.id) }));
    } else if (selected.type === "department") {
      setData((d) => ({ ...d, departments: d.departments.filter((dep) => dep.id !== selected.id) }));
    } else if (selected.type === "dependency") {
      setData((d) => ({ ...d, dependencies: d.dependencies.filter((dep) => dep.id !== selected.id) }));
    }
    setSelected(null);
    setDetail({});
  };

  const addTask = () => {
    const newTask = { id: Date.now(), name: "New Task", department: data.departments[0]?.id || 1 };
    setData((d) => ({ ...d, tasks: [...d.tasks, newTask] }));
    selectItem("task", newTask.id);
    setEditMode(true);
    setDetail({ name: newTask.name, department: newTask.department });
  };

  const addDependency = () => {
    if (data.tasks.length < 2) {
      alert("You need at least 2 tasks to create a dependency.");
      return;
    }
    const newDep = { id: Date.now(), from: data.tasks[0].id, to: data.tasks[1].id, link: "blocks" };
    setData((d) => ({ ...d, dependencies: [...d.dependencies, newDep] }));
    selectItem("dependency", newDep.id);
    setEditMode(true);
    setDetail({ from: newDep.from, to: newDep.to, link: newDep.link });
  };

  const addDepartment = () => {
    const newDept = { id: Date.now(), name: "New Dept" };
    setData((d) => ({ ...d, departments: [...d.departments, newDept] }));
    selectItem("department", newDept.id);
    setEditMode(true);
    setDetail({ name: newDept.name });
  };

  const addUser = () => {
    const newUser = { id: Date.now(), name: "New User", department: data.departments[0]?.id || 1 };
    setData((d) => ({ ...d, users: [...d.users, newUser] }));
    selectItem("user", newUser.id);
    setEditMode(true);
    setDetail({ name: newUser.name, department: newUser.department });
  };

  const getDeptName = (id) => data.departments.find((d) => d.id === id)?.name || "—";
  const getTaskName = (id) => data.tasks.find((t) => t.id === id)?.name || `Task ${id}`;

  const renderDetail = () => {
    if (!selected) return (
      <div className="detail-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: "var(--text-muted)", marginBottom: 12 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
        </svg>
        <p>Select an item from the sidebar to view or edit details</p>
      </div>
    );

    return (
      <div className="detail-panel">
        <div className="detail-type-badge">{selected.type}</div>

        {(selected.type === "user" || selected.type === "task") && (
          <>
            <div className="detail-field-group">
              <div className="detail-field-label">Name</div>
              {editMode
                ? <input className="form-field" value={detail.name} onChange={(e) => setDetail({ ...detail, name: e.target.value })} autoFocus />
                : <div className="detail-field-value">{detail.name}</div>}
            </div>
            <div className="detail-field-group">
              <div className="detail-field-label">ID</div>
              {editMode
                ? <input className="form-field" value={detail.id} onChange={(e) => setDetail({ ...detail, id:e.target.value })} />
                : <div className="detail-field-value">{detail.id}</div>}
            </div>
            <div className="detail-field-group">
              <div className="detail-field-label">Department</div>
              {editMode
                ? <select className="form-field" value={detail.department} onChange={(e) => setDetail({ ...detail, department: Number(e.target.value) })}>
                    {data.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                : <div className="detail-field-value">{getDeptName(detail.department)}</div>}
            </div>
          </>
        )}

        {selected.type === "department" && (
          <>
            <div className="detail-field-group">
              <div className="detail-field-label">Name</div>
              {editMode
                ? <input className="form-field" value={detail.name} onChange={(e) => setDetail({ ...detail, name: e.target.value })} autoFocus />
                : <div className="detail-field-value">{detail.name}</div>}
            </div>
            <div className="detail-field-group">
              <div className="detail-field-label">ID</div>
               {editMode
                ? <input className="form-field" value={detail.id} onChange={(e) => setDetail({ ...detail, id:e.target.value })} />
                : <div className="detail-field-value">{detail.id}</div>}
            </div>
            <div className="detail-field-group">
              <div className="detail-field-label">Members</div>
              <div className="detail-field-value">
                {data.users.filter((u) => u.department === selected.id).map((u) => u.name).join(", ") || "None"}
              </div>
            </div>
          </>
        )}

        {selected.type === "dependency" && (
          <>
            <div className="detail-field-group">
              <div className="detail-field-label">From Task</div>
              {editMode
                ? <select className="form-field" value={detail.from} onChange={(e) => setDetail({ ...detail, from: Number(e.target.value) })}>
                    {data.tasks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                : <div className="detail-field-value">{getTaskName(detail.from)}</div>}
            </div>
            <div className="detail-field-group">
              <div className="detail-field-label">To Task</div>
              {editMode
                ? <select className="form-field" value={detail.to} onChange={(e) => setDetail({ ...detail, to: Number(e.target.value) })}>
                    {data.tasks.filter((t) => t.id !== detail.from).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                : <div className="detail-field-value">{getTaskName(detail.to)}</div>}
            </div>
            <div className="detail-field-group">
              <div className="detail-field-label">Link Type</div>
              {editMode
                ? <select className="form-field" value={detail.link} onChange={(e) => setDetail({ ...detail, link: e.target.value })}>
                    <option value="blocks">blocks</option>
                    <option value="requires">requires</option>
                    <option value="related">related</option>
                  </select>
                : <div className="detail-field-value">{detail.link}</div>}
            </div>
          </>
        )}

        <div className="detail-actions">
          {editMode ? (
            <>
              <button className="btn btn-save btn-sm" onClick={handleSave}>Save</button>
              <button className="btn btn-sm" style={{ background: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border)" }} onClick={() => setEditMode(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => setEditMode(true)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
            </>
          )}
        </div>

        {(selected.type === "task" || selected.type === "dependency") && (
          <div className="detail-graph-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/>
              <path d="M9 10.5l6-3M9 13.5l6 3"/>
            </svg>
            Changes reflect in Graph View
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="admin-root">
      <Navbar user={user} onLogout={onLogout} onGraphView={onGraphView} />
      <div className="admin-body">
        <aside className="sidebar">

          {/* DEPARTMENTS */}
          <div className="sidebar-section">
            <div className="sidebar-section-header" onClick={() => toggleSection("departments")}>
              <span>Departments</span>
              <div className="sidebar-header-icons">
                <span className="sidebar-count">{data.departments.length}</span>
                <ChevronIcon open={openSections.departments} />
              </div>
            </div>
            {openSections.departments && (
              <div className="sidebar-items">
                {data.departments.map((d) => (
                  <div key={d.id}
                    className={`sidebar-item ${selected?.type === "department" && selected?.id === d.id ? "sidebar-item--active" : ""}`}
                    onClick={() => selectItem("department", d.id)}>
                    <span>{d.name}</span>
                    <span className="sidebar-item-actions"><ListIcon /></span>
                  </div>
                ))}
                <button className="sidebar-add" onClick={addDepartment}><PlusIcon /> Add Dept</button>
              </div>
            )}
          </div>

          {/* USERS */}
          <div className="sidebar-section">
            <div className="sidebar-section-header" onClick={() => toggleSection("users")}>
              <span>Users</span>
              <div className="sidebar-header-icons">
                <span className="sidebar-count">{data.users.length}</span>
                <ChevronIcon open={openSections.users} />
              </div>
            </div>
            {openSections.users && (
              <div className="sidebar-items">
                {data.users.map((u) => (
                  <div key={u.id}
                    className={`sidebar-item ${selected?.type === "user" && selected?.id === u.id ? "sidebar-item--active" : ""}`}
                    onClick={() => selectItem("user", u.id)}>
                    <span>{u.name}</span>
                    <span className="sidebar-item-sub">{getDeptName(u.department)}</span>
                  </div>
                ))}
                <button className="sidebar-add" onClick={addUser}><PlusIcon /> Add User</button>
              </div>
            )}
          </div>

          {/* TASKS */}
          <div className="sidebar-section">
            <div className="sidebar-section-header" onClick={() => toggleSection("tasks")}>
              <span>Tasks</span>
              <div className="sidebar-header-icons">
                <span className="sidebar-count">{data.tasks.length}</span>
                <ChevronIcon open={openSections.tasks} />
              </div>
            </div>
            {openSections.tasks && (
              <div className="sidebar-items">
                {data.tasks.map((t) => (
                  <div key={t.id}
                    className={`sidebar-item ${selected?.type === "task" && selected?.id === t.id ? "sidebar-item--active" : ""}`}
                    onClick={() => selectItem("task", t.id)}>
                    <span>{t.name}</span>
                    <span className="sidebar-item-sub">{getDeptName(t.department)}</span>
                  </div>
                ))}
                <button className="sidebar-add" onClick={addTask}><PlusIcon /> Add Task</button>
              </div>
            )}
          </div>

          {/* DEPENDENCIES */}
          <div className="sidebar-section">
            <div className="sidebar-section-header" onClick={() => toggleSection("dependencies")}>
              <span>Dependencies</span>
              <div className="sidebar-header-icons">
                <span className="sidebar-count">{data.dependencies.length}</span>
                <ChevronIcon open={openSections.dependencies} />
              </div>
            </div>
            {openSections.dependencies && (
              <div className="sidebar-items">
                {data.dependencies.map((dep) => (
                  <div key={dep.id}
                    className={`sidebar-item ${selected?.type === "dependency" && selected?.id === dep.id ? "sidebar-item--active" : ""}`}
                    onClick={() => selectItem("dependency", dep.id)}>
                    <span className="dep-item-label">
                      <span className="dep-from">{getTaskName(dep.from)}</span>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M1 5h8M6 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="dep-to">{getTaskName(dep.to)}</span>
                    </span>
                    <span className="dep-link-badge">{dep.link}</span>
                  </div>
                ))}
                <button className="sidebar-add" onClick={addDependency}><PlusIcon /> Add Dependency</button>
              </div>
            )}
          </div>

        </aside>

        <main className="admin-main">
          {renderDetail()}
        
        </main>
      </div>
    </div>
  );
}