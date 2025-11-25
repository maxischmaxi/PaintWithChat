import { getTwitchAuthUrl } from "../utils/twitch";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

export const LoginButton = () => {
  const handleLogin = () => {
    window.location.href = getTwitchAuthUrl();
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-5xl font-bold text-primary">
            PaintWithChat
          </CardTitle>
          <CardDescription className="text-base">
            Interactive Drawing Tool for Twitch Streamers
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={handleLogin} size="lg" className="gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
            </svg>
            Login with Twitch
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
