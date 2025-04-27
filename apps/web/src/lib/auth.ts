import { api } from "./api";

// 登录接口，使用 axios 实例发送表单数据
export const login = async (email: string, password: string): Promise<string> => {
  // 后端使用 OAuth2PasswordRequestForm，需提供以下字段
  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("username", email);
  params.append("password", password);
  params.append("scope", "");
  params.append("client_id", "string");
  params.append("client_secret", "string");

  const response = await api.post("/auth/login", params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return response.data.access_token ?? response.data.token;
};

// 注册接口，后端使用 JSON body
export const register = async (
  email: string,
  password: string,
  displayName: string
): Promise<string> => {
  const payload = {
    email,
    password,
    display_name: displayName,
  };

  const response = await api.post("/auth/register", payload);

  return response.data.access_token ?? response.data.token;
};
