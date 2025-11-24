import { Outlet, Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";

export default function Root() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  // Only redirect if we're sure there's no user
  if (!user && !loading) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show loading while waiting for user data
  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return <Outlet />;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loading: {
    fontSize: "24px",
    color: "white",
    fontWeight: "bold",
  },
};
