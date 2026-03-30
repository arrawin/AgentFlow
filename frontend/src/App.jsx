import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar, { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED } from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/Dashboard";
import AgentManagement from "./pages/AgentManagement";
import TaskManagement from "./pages/TaskManagement";
import LLMSettings from "./pages/LLMSettings";
import ToolsManagement from "./pages/ToolsManagement";
import Scheduler from "./pages/Scheduler";
import RunHistory from "./pages/RunHistory";
import CreateAgent from "./pages/CreateAgent";

// Global modal state — any page can call window.setModalOpen(true/false)
window.__modalOpen = false;
window.setModalOpen = (open) => {
  window.__modalOpen = open;
  const el = document.getElementById("app-root");
  if (el) el.classList.toggle("app-blur", open);
};

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <BrowserRouter>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <div id="app-root" style={{ display: "flex", flex: 1, minHeight: "100vh" }}>
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
          <div style={{ marginLeft: sidebarWidth, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--background)", transition: "margin-left 200ms ease" }}>
            <TopBar />
            <main style={{ flex: 1, padding: "36px 48px" }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/agents" element={<AgentManagement />} />
                <Route path="/agents/create" element={<CreateAgent />} />
                <Route path="/agents/edit/:id" element={<CreateAgent />} />
                <Route path="/tasks" element={<TaskManagement />} />
                <Route path="/llm" element={<LLMSettings />} />
                <Route path="/tools" element={<ToolsManagement />} />
                <Route path="/scheduler" element={<Scheduler />} />
                <Route path="/runs" element={<RunHistory />} />
              </Routes>
            </main>
          </div>
        </div>
        {/* Portal target — modals render here, outside the blurred app-root */}
        <div id="modal-root" />
      </div>
    </BrowserRouter>
  );
}
