const TWITCH_CLIENT_ID = import.meta.env.VITE_TWITCH_CLIENT_ID || "";
const REDIRECT_URI =
  import.meta.env.VITE_TWITCH_REDIRECT_URI ||
  "http://localhost:5174/auth/callback";

export const getTwitchAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: TWITCH_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "user:read:email",
  });

  return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
};

export const extractCodeFromUrl = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get("code");
};

export const getSessionIdFromUrl = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get("session");
};
