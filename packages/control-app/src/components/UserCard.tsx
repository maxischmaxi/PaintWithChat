import type { UserSession } from "@paintwithchat/shared";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

interface UserCardProps {
  user: UserSession;
  isCurrentDrawer: boolean;
  onClick: () => void;
}

export const UserCard = ({ user, isCurrentDrawer, onClick }: UserCardProps) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 cursor-pointer transition-all hover:bg-accent/50",
        isCurrentDrawer && "border-primary bg-primary/10",
      )}
    >
      <img
        src={
          user.avatar ||
          `https://ui-avatars.com/api/?name=${user.username}&background=9147ff&color=fff`
        }
        alt={user.username}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div className="flex-1 flex flex-col gap-1">
        <div className="font-bold text-base">{user.displayName}</div>
        <div className="text-xs text-muted-foreground">
          Joined {new Date(user.joinedAt).toLocaleTimeString()}
        </div>
      </div>
      {isCurrentDrawer && (
        <Badge variant="default" className="bg-primary">
          Drawing
        </Badge>
      )}
    </Card>
  );
};
