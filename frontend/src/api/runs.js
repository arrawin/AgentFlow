import api from "./client";

export const getRuns = () => api.get("/runs").then(r => r.data);
export const getRunTrace = (id) => api.get(`/runs/${id}/trace`).then(r => r.data);
