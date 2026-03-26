import api from "./client";

export const getTasks = () => api.get("/tasks").then(r => r.data);
export const getTask = (id) => api.get(`/tasks/${id}`).then(r => r.data);
export const createTask = (data) => api.post("/tasks", data).then(r => r.data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data).then(r => r.data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const runTask = (id) => api.post(`/tasks/${id}/run`).then(r => r.data);
