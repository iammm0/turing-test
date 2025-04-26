import createCache from "@emotion/cache";

// 命名用于调试
export const emotionCache = createCache({
    key: "mui", prepend: true
});