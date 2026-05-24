export const parseJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch (_) {
    return null;
  }
};

export const isTokenValid = (token) => {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return false;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp > nowInSeconds;
};

export const getValidToken = () => {
  const token = localStorage.getItem("userToken");
  return isTokenValid(token) ? token : null;
};

export const clearAuthStorage = () => {
  localStorage.removeItem("userInfo");
  localStorage.removeItem("userToken");
};
