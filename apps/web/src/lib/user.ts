import { api } from "./api";

export const getCurrentUser = () => api.get("/users/me");

export const getUserId = (): string => {
  let uid = localStorage.getItem("user_id");
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem("user_id", uid);
  }
  return uid;
};
