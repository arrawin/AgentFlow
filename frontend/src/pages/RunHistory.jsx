import { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:8000/api";

export default function RunHistory() {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [trace, setTrace] = useState([]);

  useEffect(() => {
    fetchRuns();
  }, []);

  // 🔹 Fetch all runs
  const fetchRuns = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/runs`);
      setRuns(res.data);
    } catch (err) {
      console.error("Error fetching runs:", err);
    }
  };

  // 🔹 Fetch trace for a run
  const fetchTrace = async (runId) => {
    try {
      const res = await axios.get(`${BASE_URL}/runs/${runId}/trace`);
      setTrace(res.data.trace);
      setSelectedRun(runId);
    } catch (err) {
      console.error("Error fetching trace:", err);
    }
  };

  // 🔥 Group logs by node
  const groupByNode = (logs) => {
    const grouped = {};

    logs.forEach((log) => {
      if (!grouped[log.node_id]) {
        grouped[log.node_id] = [];
      }
      grouped[log.node_id].push(log);
    });

    return grouped;
  };

  // 🔹 Format node name
  const formatNodeName = (name) =>
    name.replace(/_/g, " ").toUpperCase();

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h2 style={{ marginBottom: "20px" }}>🚀 Run History</h2>

      {/* 🔹 RUN TABLE */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "30px",
        }}
      >
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={thStyle}>Run ID</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Started</th>
            <th style={thStyle}>Action</th>
          </tr>
        </thead>

        <tbody>
          {runs.map((run) => (
            <tr key={run.id}>
              <td style={tdStyle}>{run.id}</td>
              <td style={tdStyle}>
                <StatusBadge status={run.status} />
              </td>
              <td style={tdStyle}>
                {new Date(run.started_at).toLocaleString()}
              </td>
              <td style={tdStyle}>
                <button
                  onClick={() => fetchTrace(run.id)}
                  style={buttonStyle}
                >
                  View Trace
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 🔥 TRACE TIMELINE */}
      {selectedRun && (
        <div>
          <h3 style={{ marginBottom: "20px" }}>
            📊 Execution Timeline (Run {selectedRun})
          </h3>

          {Object.entries(groupByNode(trace)).map(
            ([nodeId, logs], index) => (
              <div key={index} style={nodeCard}>
                <h4 style={{ marginBottom: "10px" }}>
                  ✔ {formatNodeName(nodeId)}
                </h4>

                {logs.map((log, i) => (
                  <div key={i} style={logItem}>
                    <span style={eventType}>
                      {log.event_type}
                    </span>
                    : {log.message}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* 🔥 COMPONENTS */

function StatusBadge({ status }) {
  const color =
    status === "completed"
      ? "#4CAF50"
      : status === "failed"
      ? "#f44336"
      : "#ff9800";

  return (
    <span
      style={{
        background: color,
        color: "white",
        padding: "5px 10px",
        borderRadius: "6px",
        fontSize: "12px",
      }}
    >
      {status}
    </span>
  );
}

/* 🔥 STYLES */

const thStyle = {
  border: "1px solid #ddd",
  padding: "10px",
};

const tdStyle = {
  border: "1px solid #ddd",
  padding: "10px",
};

const buttonStyle = {
  padding: "6px 12px",
  cursor: "pointer",
  borderRadius: "5px",
  border: "none",
  background: "#1976d2",
  color: "white",
};

const nodeCard = {
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "15px",
  marginBottom: "15px",
  background: "#fafafa",
};

const logItem = {
  marginLeft: "10px",
  marginBottom: "6px",
};

const eventType = {
  fontWeight: "bold",
  color: "#1976d2",
};