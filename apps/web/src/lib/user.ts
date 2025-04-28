import { api } from "./api";

export const getCurrentUser = () => api.get("/users/me");
