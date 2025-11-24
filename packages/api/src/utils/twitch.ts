import { config } from "../config/env";

interface TwitchTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string[];
  token_type: string;
}

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
  email?: string;
}

export const getTwitchAccessToken = async (code: string): Promise<string> => {
  try {
    const params = new URLSearchParams({
      client_id: config.twitch.clientId,
      client_secret: config.twitch.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.twitch.redirectUri,
    });

    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Twitch token error response:", errorText);
      throw new Error(
        `Twitch API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as TwitchTokenResponse;
    return data.access_token;
  } catch (error) {
    console.error("Error getting Twitch access token:", error);
    throw new Error("Failed to get Twitch access token");
  }
};

export const getTwitchUser = async (
  accessToken: string,
): Promise<TwitchUser> => {
  try {
    const response = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": config.twitch.clientId,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Twitch API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as { data: TwitchUser[] };

    if (!data.data || data.data.length === 0) {
      throw new Error("No user data returned from Twitch");
    }

    return data.data[0];
  } catch (error) {
    console.error("Error getting Twitch user:", error);
    throw new Error("Failed to get Twitch user");
  }
};

export const validateTwitchToken = async (
  accessToken: string,
): Promise<boolean> => {
  try {
    const response = await fetch("https://id.twitch.tv/oauth2/validate", {
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};
