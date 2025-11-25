import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@paintwithchat/shared";
import { getCurrentUser } from "../utils/api";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const hasToken = !!localStorage.getItem("token");

  // Try to get user from localStorage first (set by AuthCallback)
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Current user query - only enabled if we have a token but no user yet
  const {
    data: currentUserData,
    error: currentUserError,
    isLoading: isLoadingCurrentUser,
  } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    enabled: hasToken && !user,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Debug logging
  useEffect(() => {
    console.log("[useAuth] State change:", {
      hasToken,
      isLoadingCurrentUser,
      hasCurrentUserData: !!currentUserData,
      hasError: !!currentUserError,
      currentUser: user?.displayName,
    });
  }, [hasToken, isLoadingCurrentUser, currentUserData, currentUserError, user]);

  // Update user from query result
  useEffect(() => {
    if (currentUserData) {
      console.log(
        "[useAuth] Setting user from query data:",
        currentUserData.user.displayName,
      );
      setUser(currentUserData.user);
      localStorage.setItem("user", JSON.stringify(currentUserData.user));
    } else if (!hasToken) {
      // No token, so no user
      console.log("[useAuth] No token, clearing user");
      setUser(null);
      localStorage.removeItem("user");
    }
  }, [currentUserData, hasToken]);

  // Handle auth errors
  useEffect(() => {
    if (currentUserError) {
      console.error("[useAuth] Auth error, clearing token:", currentUserError);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      queryClient.clear();
    }
  }, [currentUserError, queryClient]);

  const logout = () => {
    console.log("[useAuth] Logout called");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    queryClient.clear();
  };

  const loading = hasToken && isLoadingCurrentUser && !user;
  const error = currentUserError ? "Session expired" : null;

  return { user, loading, error, logout };
};
