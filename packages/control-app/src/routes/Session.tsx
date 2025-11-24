import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { SessionControl } from "../components/SessionControl";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { LogOut } from "lucide-react";

export default function Session() {
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen flex flex-col">
      <nav className="border-b bg-card flex-shrink-0 px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-primary">StreamDraw</div>
        <div className="flex items-center gap-4">
          <Badge variant={connected ? "default" : "secondary"}>
            {connected ? "Connected" : "Disconnected"}
          </Badge>
          <span className="font-medium">{user.displayName}</span>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </nav>
      <div className="flex-1 overflow-hidden">
        <SessionControl
          token={localStorage.getItem("token") || ""}
          username={user.displayName}
          sessionId={id}
          onConnectionChange={setConnected}
        />
      </div>
    </div>
  );
}
