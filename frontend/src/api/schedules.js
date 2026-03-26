import api from "./client";

export const getSchedules = () => api.get("/schedules").then(r => r.data);
export const createSchedule = (data) => api.post("/schedules", data).then(r => r.data);
export const updateSchedule = (id, data) => api.patch(`/schedules/${id}`, data).then(r => r.data);
export const deleteSchedule = (id) => api.delete(`/schedules/${id}`);
