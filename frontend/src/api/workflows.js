import api from "./client";

export const getWorkflows = () => api.get("/workflows").then(r => r.data);
export const createWorkflow = (data) => api.post("/workflows", data).then(r => r.data);
export const deleteWorkflow = (id) => api.delete(`/workflows/${id}`);
