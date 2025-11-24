import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginWithTwitch } from "../utils/api";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasAttemptedLogin = useRef(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (msg: string) => {
    console.log("[AuthCallback]", msg);
    setDebugInfo((prev) => [...prev, msg]);
  };

  const loginMutation = useMutation({
    mutationFn: loginWithTwitch,
    onSuccess: (data) => {
      addDebug("Login successful, received token and user data");
      addDebug(`User: ${data.user.displayName}`);

      // Save token and user to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      addDebug("Token and user saved to localStorage");

      // Set user data in cache immediately
      queryClient.setQueryData(["currentUser"], { user: data.user });
      addDebug("User data set in query cache");

      // Navigate after a short delay to ensure state is updated
      addDebug("Navigating to / in 100ms...");
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
    },
    onError: (error: any) => {
      addDebug(`Login failed: ${error?.message || error}`);
      console.error("Login failed - Full error:", error);

      // Wait a bit before redirecting to show error
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    },
  });

  useEffect(() => {
    const code = searchParams.get("code");
    addDebug(`AuthCallback mounted with code: ${code ? "present" : "missing"}`);

    if (!code) {
      addDebug("No code found, redirecting to login");
      navigate("/login", { replace: true });
      return;
    }

    // Only attempt login once
    if (!hasAttemptedLogin.current && !loginMutation.isPending) {
      hasAttemptedLogin.current = true;
      addDebug("Attempting login with Twitch code...");
      loginMutation.mutate(code);
    }
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.loading}>
        {loginMutation.isPending ? "Logging in..." : "Processing..."}
      </div>
      {loginMutation.isError && (
        <div style={styles.error}>
          Failed to login. Redirecting to login page...
          <br />
          Check console for details.
        </div>
      )}
      {process.env.NODE_ENV === "development" && (
        <div style={styles.debug}>
          <h3>Debug Log:</h3>
          {debugInfo.map((msg, i) => (
            <div key={i}>{msg}</div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: "20px",
  },
  loading: {
    fontSize: "18px",
    color: "#666",
  },
  error: {
    padding: "16px",
    backgroundColor: "#ffebee",
    color: "#c62828",
    borderRadius: "8px",
  },
  debug: {
    marginTop: "20px",
    padding: "16px",
    backgroundColor: "#f5f5f5",
    borderRadius: "8px",
    fontSize: "12px",
    fontFamily: "monospace",
    maxWidth: "600px",
    textAlign: "left",
  },
};
