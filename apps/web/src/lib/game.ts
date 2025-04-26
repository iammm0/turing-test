import { api } from "./api";
import {Msg} from "@/types";

export const guessAI = (gameId: string, suspect_ai: boolean) =>
  api.post(`/rooms/${gameId}/guess`, { suspect_ai });

export const getGameById = (id: string) =>
  api.get(`/games/${id}`);

export const getGameHistory = (id: string) =>
  api.get(`/games/${id}/messages`);

export const getGameMessages = (gameId: string) =>
  api.get<Msg[]>(`/games/${gameId}/messages`);

export const sendMessage = (gameId: string, msg: Msg) =>
  api.post(`/rooms/${gameId}/messages`, msg);