import { api } from "./api";

/**
 * 加入匹配队列：不再需要参数，只需当前认证用户
 */
export const enqueueMatch = () => {
  return api.post("/match/queue");
};

/**
 * 轮询匹配结果：返回 { matched, match_id?, ... }
 */
export const pollMatch = () =>
  api.post("/match/poll");

/**
 * 接受匹配确认：传入 { match_id }
 */
export const acceptMatch = (data: { match_id: string }) =>
  api.post("/match/accept", data);
