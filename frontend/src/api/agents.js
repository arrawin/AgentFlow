import api from "./client";

export const getAgents = () => api.get("/agents").then(r => r.data);
export const getAgent = (id) => api.get(`/agents/${id}`).then(r => r.data);
export const createAgent = (data) => api.post("/agents", data).then(r => r.data);
export const updateAgent = (id, data) => api.put(`/agents/${id}`, data).then(r => r.data);
export const deleteAgent = (id) => api.delete(`/agents/${id}`);
