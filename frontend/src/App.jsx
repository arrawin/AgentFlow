import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/Dashboard";
import AgentManagement from "./pages/AgentManagement";
import TaskManagement from "./pages/TaskManagement";
import LLMSettings from "./pages/LLMSettings";
import ToolsManagement from "./pages/ToolsManagement";
import Scheduler from "./pages/Scheduler";
import RunHistory from "./pages/RunHistory";
import CreateAgent from "./pages/CreateAgent";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <div style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--background)" }}>
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
    </BrowserRouter>
  );
}
