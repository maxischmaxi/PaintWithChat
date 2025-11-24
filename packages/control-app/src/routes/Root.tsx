import { Outlet, Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useEffect } from "react";

export default function Root() {
  const { user, loading, error } = useAuth();
  const location = useLocation();
  const hasToken = !!localStorage.getItem("token");

  useEffect(() => {
    console.log("[Root] State:", {
      hasUser: !!user,
      loading,
      error,
      hasToken,
      userDisplayName: user?.displayName,
    });
  }, [user, loading, error, hasToken]);

  if (loading) {
    console.log("[Root] Rendering loading state");
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading user data...</div>
      </div>
    );
  }

  if (error) {
    console.log("[Root] Rendering error state:", error);
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
        <button onClick={() => window.location.reload()} style={styles.button}>
          Retry
        </button>
      </div>
    );
  }

  // Only redirect if we're sure there's no user
  if (!user && !loading) {
    console.log("[Root] No user and not loading, redirecting to /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show loading while waiting for user data
  if (!user) {
    console.log("[Root] No user yet, showing loading");
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Initializing...</div>
      </div>
    );
  }

  console.log("[Root] Rendering dashboard for user:", user.displayName);
  return <Outlet />;
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
    color: "#999",
  },
  error: {
    padding: "16px",
    backgroundColor: "#4a1818",
    color: "#ff6b6b",
    borderRadius: "8px",
  },
  button: {
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "bold",
    color: "white",
    backgroundColor: "#9147ff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
};
