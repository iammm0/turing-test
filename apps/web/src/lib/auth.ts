export function decodeJwt(token: string) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch (err) {
    console.error("⚠️ 无法解码 JWT:", err);
    return null;
  }
}
