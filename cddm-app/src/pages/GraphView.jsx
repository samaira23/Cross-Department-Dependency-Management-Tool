import { useState, useRef, useCallback, useEffect } from "react";
import Navbar from "../components/navbar";
import "./GraphView.css";

// Assign stable positions to nodes, spreading them out nicely
function buildNodes(tasks, existingNodes) {
  const COLS = 4;
  const X_GAP = 140;
  const Y_GAP = 120;
  const OFFSET_X = 100;
  const OFFSET_Y = 80;

  return tasks.map((task, i) => {
    // Keep existing position if node already placed
    const existing = existingNodes.find((n) => n.id === task.id);
    if (existing) return existing;
    return {
      id: task.id,
      label: task.name,
      x: OFFSET_X + (i % COLS) * X_GAP,
      y: OFFSET_Y + Math.floor(i / COLS) * Y_GAP,
    };
  });
}

export default function GraphView({ user, data, onLogout, onBack }) {
  const [nodes, setNodes] = useState(() => buildNodes(data.tasks, []));
  const [dragging, setDragging] = useState(null);
  const [selected, setSelected] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNodes((prev) => {
      const withNew = buildNodes(data.tasks, prev);
      return withNew
        .filter((n) => data.tasks.some((t) => t.id === n.id))
        .map((n) => {
          const task = data.tasks.find((t) => t.id === n.id);
          return task ? { ...n, label: task.name } : n;
        });
    });
  }, [data.tasks]);

  const handleMouseDown = (e, id) => {
    e.stopPropagation();
    setDragging(id);
    setSelected(id);
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setNodes((ns) =>
      ns.map((n) =>
        n.id === dragging
          ? { ...n, x: e.clientX - rect.left, y: e.clientY - rect.top }
          : n
      )
    );
  }, [dragging]);

  const handleMouseUp = () => setDragging(null);

  const getNode = (id) => nodes.find((n) => n.id === id);

  const getDeptColor = (taskId) => {
    const task = data.tasks.find((t) => t.id === taskId);
    if (!task) return "#5a5a6a";
    const deptIndex = data.departments.findIndex((d) => d.id === task.department);
    const colors = ["#4a90d9", "#5bb87a", "#d9924a", "#9b59b6", "#e74c3c", "#1abc9c"];
    return colors[deptIndex % colors.length] || "#5a5a6a";
  };

  const getLinkColor = (link) => {
    if (link === "blocks") return "#d9534f";
    if (link === "requires") return "#f0ad4e";
    return "#5a5a6a";
  };

  // Build curved path between two nodes
  const getCurvedPath = (from, to) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const cx = (from.x + to.x) / 2 - dy * 0.2;
    const cy = (from.y + to.y) / 2 + dx * 0.2;
    return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
  };

  const selectedTask = selected ? data.tasks.find((t) => t.id === selected) : null;
  const selectedDeps = selected
    ? data.dependencies.filter((d) => d.from === selected || d.to === selected)
    : [];

  return (
    <div className="graph-root">
      <Navbar user={user} onLogout={onLogout} onGraphView={onBack} currentPage="graph" />
      <div className="graph-body">

        {/* LEFT PANEL — task list */}
        <aside className="graph-sidebar">
          <div className="graph-sidebar-section">
            <div className="graph-sidebar-label">
              Tasks
              <span className="graph-sidebar-count">{data.tasks.length}</span>
            </div>
            {data.tasks.length === 0 && (
              <div className="graph-empty-hint">No tasks yet. Add them in Admin.</div>
            )}
            {data.tasks.map((t) => {
              const color = getDeptColor(t.id);
              const isSelected = selected === t.id;
              return (
                <div
                  key={t.id}
                  className={`graph-sidebar-item ${isSelected ? "graph-sidebar-item--active" : ""}`}
                  onClick={() => setSelected(isSelected ? null : t.id)}
                >
                  <span className="graph-sidebar-dot" style={{ background: color }} />
                  <span>{t.name}</span>
                </div>
              );
            })}
          </div>

          <div className="graph-sidebar-section">
            <div className="graph-sidebar-label">
              Dependencies
              <span className="graph-sidebar-count">{data.dependencies.length}</span>
            </div>
            {data.dependencies.length === 0 && (
              <div className="graph-empty-hint">No dependencies yet. Add them in Admin.</div>
            )}
            {data.dependencies.map((dep) => {
              const fromTask = data.tasks.find((t) => t.id === dep.from);
              const toTask = data.tasks.find((t) => t.id === dep.to);
              if (!fromTask || !toTask) return null;
              return (
                <div key={dep.id} className="graph-sidebar-dep">
                  <span className="dep-badge" style={{ background: getLinkColor(dep.link) }}>{dep.link}</span>
                  <span className="dep-label">{fromTask.name} → {toTask.name}</span>
                </div>
              );
            })}
          </div>

          {/* Selected node info */}
          {selectedTask && (
            <div className="graph-sidebar-section graph-info-box">
              <div className="graph-sidebar-label">Selected</div>
              <div className="graph-info-name">{selectedTask.name}</div>
              <div className="graph-info-dept">
                {data.departments.find((d) => d.id === selectedTask.department)?.name || "—"}
              </div>
              {selectedDeps.length > 0 && (
                <div className="graph-info-deps">
                  {selectedDeps.map((dep) => {
                    const other = dep.from === selected
                      ? data.tasks.find((t) => t.id === dep.to)
                      : data.tasks.find((t) => t.id === dep.from);
                    const dir = dep.from === selected ? "→" : "←";
                    return (
                      <div key={dep.id} className="graph-info-dep-row">
                        <span className="dep-badge" style={{ background: getLinkColor(dep.link), fontSize: 9 }}>{dep.link}</span>
                        {dir} {other?.name}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* SVG CANVAS */}
        <main className="graph-canvas-area">
          <div className="graph-canvas-label">TASK / DEPENDENCY GRAPH</div>

          {data.tasks.length === 0 && (
            <div className="graph-canvas-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/>
                <path d="M9 10.5l6-3M9 13.5l6 3"/>
              </svg>
              <p>Add tasks in Admin Dashboard to see them here</p>
            </div>
          )}

          <svg
            ref={svgRef}
            className="graph-svg"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setSelected(null)}
          >
            <defs>
              <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="#3a3a48" />
              </pattern>
              {/* Arrowhead markers per link type */}
              {["blocks", "requires", "related"].map((type) => (
                <marker key={type} id={`arrow-${type}`} markerWidth="8" markerHeight="8"
                  refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={getLinkColor(type)} opacity="0.8" />
                </marker>
              ))}
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />

            {/* EDGES */}
            {data.dependencies.map((dep) => {
              const from = getNode(dep.from);
              const to = getNode(dep.to);
              if (!from || !to) return null;
              const isHighlighted = selected === dep.from || selected === dep.to;
              const color = getLinkColor(dep.link);
              const path = getCurvedPath(from, to);
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;

              return (
                <g key={dep.id}>
                  <path
                    d={path}
                    stroke={color}
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    fill="none"
                    opacity={isHighlighted ? 1 : 0.45}
                    strokeDasharray={dep.link === "related" ? "5 4" : "none"}
                    markerEnd={`url(#arrow-${dep.link})`}
                  />
                  {/* Link label */}
                  <text
                    x={midX} y={midY - 6}
                    textAnchor="middle"
                    fill={color}
                    fontSize="9"
                    fontFamily="Rajdhani, sans-serif"
                    fontWeight="700"
                    opacity={isHighlighted ? 1 : 0.5}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {dep.link}
                  </text>
                </g>
              );
            })}

            {/* NODES */}
            {nodes.map((n) => {
              const color = getDeptColor(n.id);
              const isSelected = selected === n.id;
              const task = data.tasks.find((t) => t.id === n.id);
              const deptName = task ? data.departments.find((d) => d.id === task.department)?.name : "";
              const isConnected = selected
                ? data.dependencies.some((d) => (d.from === selected && d.to === n.id) || (d.to === selected && d.from === n.id))
                : false;

              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  style={{ cursor: dragging === n.id ? "grabbing" : "grab" }}
                  onMouseDown={(e) => handleMouseDown(e, n.id)}
                  onClick={(e) => { e.stopPropagation(); setSelected(isSelected ? null : n.id); }}
                >
                  {/* Glow ring when selected */}
                  {isSelected && (
                    <circle r="32" fill="none" stroke={color} strokeWidth="1.5" opacity="0.3" />
                  )}
                  {/* Connected ring */}
                  {isConnected && !isSelected && (
                    <circle r="28" fill="none" stroke={color} strokeWidth="1" opacity="0.4" strokeDasharray="3 3" />
                  )}

                  <circle
                    r="24"
                    fill={isSelected ? color : "#2e2e38"}
                    stroke={color}
                    strokeWidth={isSelected ? 0 : isConnected ? 2 : 1.5}
                    opacity={selected && !isSelected && !isConnected ? 0.4 : 1}
                    style={{ transition: "fill 0.2s, opacity 0.2s" }}
                  />

                  {/* Task name */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    y={deptName ? -4 : 0}
                    fill={isSelected ? "#fff" : color}
                    fontSize="10"
                    fontFamily="Rajdhani, sans-serif"
                    fontWeight="700"
                    letterSpacing="0.5"
                    style={{ userSelect: "none", pointerEvents: "none" }}
                  >
                    {n.label.length > 9 ? n.label.slice(0, 8) + "…" : n.label}
                  </text>

                  {/* Department subtitle */}
                  {deptName && (
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      y={8}
                      fill={isSelected ? "rgba(255,255,255,0.7)" : "var(--text-muted)"}
                      fontSize="7"
                      fontFamily="DM Sans, sans-serif"
                      style={{ userSelect: "none", pointerEvents: "none" }}
                    >
                      {deptName.length > 7 ? deptName.slice(0, 6) + "…" : deptName}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </main>
      </div>
    </div>
  );
}