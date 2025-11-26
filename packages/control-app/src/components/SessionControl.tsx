import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { Session } from "@paintwithchat/shared";
import { useSocket } from "../hooks/useSocket";
import {
  startSession,
  getCurrentSession,
  endSession,
  selectNextUser,
  selectUser,
} from "../utils/api";
import { UserCard } from "./UserCard";
import { DrawingCanvas } from "./DrawingCanvas";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Copy, Users, Pencil, Link2 } from "lucide-react";

interface SessionControlProps {
  token: string;
  username: string;
  sessionId?: string;
  onConnectionChange?: (connected: boolean) => void;
}

export const SessionControl = ({
  token,
  username,
  sessionId,
  onConnectionChange,
}: SessionControlProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // WebSocket connection (no drawing handlers - free drawing for now)
  const { socket, connected, sessionUpdate } = useSocket(
    session?.id || null,
    token,
  );

  // Notify parent about connection changes
  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(connected);
    }
  }, [connected, onConnectionChange]);

  // Query for current session
  const { data: currentSessionData } = useQuery({
    queryKey: ["currentSession"],
    queryFn: getCurrentSession,
    retry: false,
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: startSession,
    onSuccess: (data) => {
      setSession(data.session);
      queryClient.invalidateQueries({ queryKey: ["currentSession"] });
      // Navigate to session page
      navigate(`/session/${data.session.id}`);
    },
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: endSession,
    onSuccess: () => {
      setSession(null);
      queryClient.invalidateQueries({ queryKey: ["currentSession"] });
      // Navigate back to dashboard
      navigate("/");
    },
  });

  // Next user mutation
  const nextUserMutation = useMutation({
    mutationFn: selectNextUser,
    onSuccess: (data) => {
      setSession(data.session);
    },
  });

  // Select user mutation
  const selectUserMutation = useMutation({
    mutationFn: selectUser,
    onSuccess: (data) => {
      setSession(data.session);
    },
  });

  // Update session from socket updates
  useEffect(() => {
    if (sessionUpdate) {
      setSession((prevSession) => {
        if (!prevSession) return null;
        return {
          ...prevSession,
          currentDrawerId: sessionUpdate.currentDrawerId,
          activeUsers: sessionUpdate.activeUsers,
          active: sessionUpdate.active,
        };
      });
    }
  }, [sessionUpdate]);

  // Load current session on mount
  useEffect(() => {
    if (currentSessionData) {
      setSession(currentSessionData.session);
    }
  }, [currentSessionData]);

  const handleStartSession = () => {
    startSessionMutation.mutate();
  };

  const handleEndSession = () => {
    endSessionMutation.mutate();
  };

  const handleNextUser = () => {
    nextUserMutation.mutate();
  };

  const handleSelectUser = (userId: string) => {
    selectUserMutation.mutate(userId);
  };

  const handleCopySessionLink = async () => {
    if (session) {
      const sessionUrl = `${window.location.origin}/session/${session.id}`;
      await navigator.clipboard.writeText(sessionUrl);
      toast.success("Session link copied to clipboard!");
    }
  };

  const handleCopyOverlayLink = async () => {
    if (session) {
      const overlayUrl = `http://localhost:5174?session=${session.id}`;
      await navigator.clipboard.writeText(overlayUrl);
      toast.success("OBS overlay link copied to clipboard!");
    }
  };

  const loading =
    startSessionMutation.isPending ||
    endSessionMutation.isPending ||
    nextUserMutation.isPending ||
    selectUserMutation.isPending;

  const error =
    (startSessionMutation.error as any)?.data?.message ||
    (endSessionMutation.error as any)?.data?.message ||
    (nextUserMutation.error as any)?.data?.message ||
    (selectUserMutation.error as any)?.data?.message ||
    null;

  if (!session) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <Card className="border-primary/20">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-4xl">Welcome, {username}!</CardTitle>
            <CardDescription className="text-base">
              Start a session to let viewers draw on your stream
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Button
              onClick={handleStartSession}
              disabled={loading}
              size="lg"
              className="w-full max-w-xs"
            >
              {loading ? "Starting..." : "Start Session"}
            </Button>
            {error && (
              <div className="w-full p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card p-4 overflow-y-auto space-y-4 flex-shrink-0">
        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handleCopySessionLink}
            variant="outline"
            className="w-full"
          >
            <Link2 className="w-4 h-4 mr-2" />
            Copy Session Link
          </Button>
          <Button
            onClick={handleCopyOverlayLink}
            variant="outline"
            className="w-full"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy OBS Link
          </Button>
          <Button
            onClick={handleEndSession}
            variant="destructive"
            className="w-full"
          >
            End Session
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              Users
            </div>
            <div className="text-2xl font-bold text-primary">
              {session.activeUsers.length}
            </div>
          </Card>

          <Card className="p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Pencil className="w-3 h-3" />
              Drawing
            </div>
            <div className="text-2xl font-bold text-primary">
              {session.currentDrawerId ? "Yes" : "No"}
            </div>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleNextUser}
              disabled={loading || session.activeUsers.length === 0}
              className="w-full"
              size="sm"
            >
              Select Random User
            </Button>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Users</CardTitle>
            <CardDescription className="text-xs">
              Click to give drawing permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {session.activeUsers.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No users yet. Share your link!
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {session.activeUsers.map((user) => (
                  <UserCard
                    key={user.userId}
                    user={user}
                    isCurrentDrawer={session.currentDrawerId === user.userId}
                    onClick={() => handleSelectUser(user.userId)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Canvas */}
      <div className="flex-1 p-6">
        <DrawingCanvas socket={socket} />
      </div>
    </div>
  );
};
