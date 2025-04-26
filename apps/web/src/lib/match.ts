import { api } from "./api";

export const enqueueMatch = (params: {
  role: "I" | "W";
  elo: number;
  user_id: string;
}) =>
  api.post("/match/queue", {}, { params });

export const pollMatch = () =>
  api.post("/match/poll");

export const getMatchStatus = () =>
  api.get("/match/status");
