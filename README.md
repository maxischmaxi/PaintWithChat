# 🎨 PaintWithChat - Interactive Twitch Drawing Platform

> **AI Agent Optimized Documentation** - This README is designed for AI coding agents to quickly understand and work with the codebase.

> ⚠️ **IMPORTANT UPDATE (2024-11-25)**: This project now uses **Docker** instead of Nixpacks for Railway deployments. See [MIGRATION_NIXPACKS_TO_DOCKER.md](MIGRATION_NIXPACKS_TO_DOCKER.md) for details.

## 📊 Project Overview

**PaintWithChat** is a real-time collaborative drawing platform for Twitch streamers that allows viewers to draw on the stream. The system consists of three main applications connected via WebSockets for real-time synchronization.

### Key Capabilities

- **Real-time Drawing**: Multiple users can draw sequentially with instant updates
- **Twitch Integration**: OAuth authentication and user management
- **OBS Studio Support**: Transparent overlay for streaming software
- **Session Management**: Streamer controls who can draw and when
- **WebSocket Sync**: All drawing operations synchronized in real-time

---

## 🏗️ Architecture

### Monorepo Structure

```
paintwithchat/
├── packages/
│   ├── api/           # Backend (Express + Socket.io + MongoDB)
│   ├── control-app/   # Streamer Control Panel (React + Vite)
│   ├── overlay-app/   # Public Viewer Overlay (React + Vite)
│   └── shared/        # Shared TypeScript types & constants
├── docker-compose.yml # MongoDB + Mongo Express
└── pnpm-workspace.yaml
```

### Technology Stack

**Backend (packages/api):**

- Express.js 4.21 - REST API server
- Socket.io 4.8 - WebSocket server for real-time communication
- MongoDB 8.0 - Document database
- Mongoose 8.8 - MongoDB ODM
- JWT (jsonwebtoken) - Authentication tokens
- Axios - Twitch API client
- TypeScript 5.7

**Frontend (control-app & overlay-app):**

- React 19.0.0 - UI framework
- TypeScript 5.7 - Type safety
- Vite 6.0 - Build tool & dev server
- Socket.io-client 4.8 - WebSocket client
- Tailwind CSS 4.1 - Styling
- shadcn/ui - UI components
- HTML5 Canvas API - Drawing surface
- React Router 7.1 - Client-side routing
- TanStack Query 5.62 - Server state management
- Sonner - Toast notifications

**Shared (packages/shared):**

- Pure TypeScript types and constants
- WebSocket event definitions
- API request/response types
- Canvas configuration constants

---

## 🔑 Core Concepts

### 1. User Roles

**Streamer:**

- Creates and manages drawing sessions
- Connects to session as observer (not in active users list)
- Selects which viewer can draw
- Views real-time drawings on canvas
- Ends sessions when done

**Viewer (Overlay App):**

- Anonymous viewers (no authentication required)
- Join sessions via session ID in URL
- View drawings in real-time
- Cannot interact with canvas (view-only)

**Participant (Future):**

- Authenticated viewers who join via session link
- Added to active users list
- Can be selected to draw
- Use drawing tools when selected as current drawer

### 2. Session Flow

```
1. Streamer logs in to Control App (http://localhost:5173)
2. Streamer starts new session
3. System generates session ID
4. Streamer copies OBS overlay link (http://localhost:5174?session=ID)
5. Streamer adds overlay to OBS as Browser Source
6. Viewers open overlay URL anonymously
7. Participants join via session link (when implemented)
8. Streamer selects drawer from active users
9. Selected user draws on canvas
10. All connected clients see drawings in real-time
11. Streamer selects next drawer or ends session
```

### 3. WebSocket Events

**Three Connection Types:**

1. **`streamer:join`** (Control App)
   - Authenticated via JWT token
   - Must be session owner
   - NOT added to activeUsers array
   - Receives all session updates
   - Receives all drawing events

2. **`viewer:join`** (Overlay App)
   - No authentication required
   - Public access via session ID
   - NOT added to activeUsers array
   - Receives all session updates
   - Receives all drawing events
   - Cannot send drawing events

3. **`user:join`** (Future Participant App)
   - Authenticated via JWT token
   - Added to activeUsers array
   - Can be selected as current drawer
   - Can send drawing events when selected

**Drawing Events:**

```typescript
// Client -> Server (only from current drawer)
drawing:start  { point, color, size }
drawing:move   { point }
drawing:end    { }
canvas:clear   { }

// Server -> All Clients
drawing:stroke-start  { userId, point, color, size }
drawing:stroke-move   { userId, point }
drawing:stroke-end    { userId, stroke }
canvas:cleared        { }

// Session Events
session:updated       { session }
user:joined          { user }
user:left            { userId }
drawer:changed       { drawerId, username }
```

---

## 📁 Detailed Package Structure

### packages/api

```
api/
├── src/
│   ├── config/
│   │   ├── database.ts       # MongoDB connection setup
│   │   └── env.ts            # Environment variable validation
│   ├── middleware/
│   │   └── auth.ts           # JWT authentication middleware
│   ├── models/
│   │   ├── Drawing.ts        # Drawing strokes storage
│   │   ├── Session.ts        # Session management
│   │   ├── User.ts           # User data
│   │   └── index.ts          # Model exports
│   ├── routes/
│   │   ├── auth.ts           # Twitch OAuth endpoints
│   │   └── session.ts        # Session CRUD operations
│   ├── socket/
│   │   └── index.ts          # Socket.io event handlers
│   ├── utils/
│   │   ├── jwt.ts            # JWT token generation/verification
│   │   └── twitch.ts         # Twitch API integration
│   └── index.ts              # Express app & server startup
├── package.json
└── tsconfig.json
```

**Key Files:**

**`src/socket/index.ts`** (292 lines) - WebSocket event handlers:

- Connection management for streamer/viewer/user
- Drawing event broadcasting
- Session state synchronization
- User join/leave handling
- Active stroke management in memory
- Database persistence for completed strokes

**`src/routes/session.ts`** - Session management endpoints:

- `POST /session/start` - Create new session
- `GET /session/current` - Get active session
- `POST /session/next-user` - Random drawer selection
- `POST /session/select-user` - Manual drawer selection
- `POST /session/end` - End active session

**`src/routes/auth.ts`** - Authentication:

- `POST /auth/twitch` - Exchange Twitch code for JWT
- `GET /auth/me` - Get current user info

**`src/models/Session.ts`** - Session schema:

```typescript
{
  streamerId: string;        // MongoDB _id of creator
  streamerName: string;      // Display name
  active: boolean;           // Session state
  currentDrawerId: string | null;  // MongoDB _id of current drawer
  activeUsers: UserSession[];      // Connected participants
  createdAt: Date;
  endedAt?: Date;
}
```

**`src/models/User.ts`** - User schema:

```typescript
{
  twitchId: string; // Unique Twitch ID
  username: string; // Twitch username
  displayName: string; // Display name
  avatar: string; // Profile image URL
  createdAt: Date;
}
```

**Environment Variables (api):**

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/paintwithchat
JWT_SECRET=your-secret-key
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret
TWITCH_REDIRECT_URI=http://localhost:5173/auth/callback
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### packages/control-app

```
control-app/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── sonner.tsx   # Toast notifications
│   │   ├── LoginButton.tsx
│   │   ├── SessionControl.tsx   # Main session UI (sidebar + canvas)
│   │   ├── UserCard.tsx         # Active user display
│   │   └── ViewerCanvas.tsx     # Read-only canvas component
│   ├── hooks/
│   │   ├── useAuth.ts          # Authentication state management
│   │   └── useSocket.ts        # WebSocket connection & events
│   ├── routes/
│   │   ├── AuthCallback.tsx    # OAuth redirect handler
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── Login.tsx           # Login page
│   │   ├── Root.tsx            # Protected route wrapper
│   │   └── Session.tsx         # Session page
│   ├── utils/
│   │   ├── api.ts             # API client functions
│   │   └── twitch.ts          # Twitch OAuth helpers
│   ├── index.css              # Global styles + Tailwind
│   └── main.tsx               # App entry point
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

**Key Components:**

**`SessionControl.tsx`** - Main session management UI:

- **Layout**: Sidebar (320px) + Main Content (flex-1)
- **Sidebar Contents**:
  - Copy Session Link button
  - Copy OBS Overlay Link button
  - End Session button
  - Stats cards (Active Users count, Drawing status)
  - Select Random User button
  - Active Users list (clickable to select drawer)
- **Main Content**:
  - ViewerCanvas component showing real-time drawings
  - White canvas background
  - Full height, responsive sizing

**`ViewerCanvas.tsx`** - Read-only canvas for streamer:

- Canvas size: 1920x1080px (CANVAS_WIDTH x CANVAS_HEIGHT)
- White background
- Displays real-time drawing strokes
- No drawing tools (view-only)
- Receives drawing events via window.\_\_canvas\* functions
- Uses HTML5 Canvas API for rendering

**`useSocket.ts`** - WebSocket hook:

- Connects as streamer via `streamer:join` event
- Manages connection state
- Handles session updates
- Receives drawing events
- Uses refs to avoid re-render loops with handlers
- Returns: socket, connected, sessionUpdate, error

**`useAuth.ts`** - Authentication hook:

- Stores user in localStorage for persistence
- Fetches current user from API
- Handles token expiration
- Returns: user, loading, error, logout

**Layout Structure:**

```jsx
<Session> (h-screen, flex-col)
  <nav> (flex-shrink-0, px-4 py-4)
    - PaintWithChat logo (left)
    - Connected badge + User + Logout (right)

  <div> (flex-1, overflow-hidden)
    <SessionControl> (flex, h-full)
      <Sidebar> (w-80, border-r)
        - Buttons
        - Stats
        - Controls
        - Users List

      <MainContent> (flex-1, p-6)
        <ViewerCanvas />
```

**Environment Variables (control-app):**

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
VITE_TWITCH_CLIENT_ID=your-twitch-client-id
VITE_TWITCH_REDIRECT_URI=http://localhost:5173/auth/callback
```

### packages/overlay-app

```
overlay-app/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   └── card.tsx
│   │   ├── DrawingCanvas.tsx    # Full interactive canvas (for future participants)
│   │   └── LoginOverlay.tsx     # Login UI (currently unused)
│   ├── hooks/
│   │   ├── useAuth.ts           # Auth hook (currently unused)
│   │   └── useOverlaySocket.ts  # WebSocket for overlay
│   ├── routes/
│   │   ├── AuthCallback.tsx     # OAuth callback (currently unused)
│   │   ├── Login.tsx            # Login route (currently unused)
│   │   ├── Overlay.tsx          # Main overlay component
│   │   └── Root.tsx             # Route wrapper (currently unused)
│   ├── utils/
│   │   ├── api.ts              # API client
│   │   └── twitch.ts           # Twitch helpers
│   ├── index.css               # Dark theme styles
│   └── main.tsx                # App entry point
├── index.html
├── package.json
└── vite.config.ts
```

**Key Components:**

**`Overlay.tsx`** - Main overlay component:

- **Purpose**: Public view-only display for viewers
- **Access**: No authentication required
- **URL Pattern**: `/?session=SESSION_ID`
- **Features**:
  - Transparent background
  - Shows current drawer name
  - Displays real-time drawings
  - Full screen canvas (100vw x 100vh)
  - Status indicator (drawer name)
- **No Interaction**: Canvas is view-only, no drawing tools shown

**`DrawingCanvas.tsx`** - Interactive canvas component (for future use):

- Full drawing capabilities with toolbar
- Color picker (10 colors)
- Brush size selector (6 sizes)
- Clear canvas button
- Only visible when `isDrawing={true}`
- Canvas size: 1920x1080px
- Handles mouse/touch events for drawing
- Emits drawing events via callbacks

**`useOverlaySocket.ts`** - WebSocket hook:

- Connects as viewer via `viewer:join` event
- No authentication required
- Session ID from URL query parameter
- Receives session updates and drawing events
- Returns: socket, connected, currentDrawerName

**Layout:**

```jsx
<Overlay>
  {" "}
  (w-screen h-screen, bg-transparent)
  {currentDrawerName && (
    <StatusBar>
      {" "}
      (absolute top, centered) "👁 {currentDrawerName} is drawing"
    </StatusBar>
  )}
  <DrawingCanvas>
    {" "}
    (view-only, isDrawing={false}) - No toolbar shown - Only displays remote
    strokes
  </DrawingCanvas>
  {!connected && <DisconnectedIndicator />}
</Overlay>
```

**Current State (View-Only):**

- No login required
- No authentication
- No user management
- Pure viewer mode
- Connects anonymously with session ID

**Future Participant Mode:**

- Would require login
- JWT authentication
- Added to activeUsers
- Can be selected as drawer
- Shows drawing tools when selected

**Environment Variables (overlay-app):**

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
VITE_TWITCH_CLIENT_ID=your-twitch-client-id
VITE_TWITCH_REDIRECT_URI=http://localhost:5174/auth/callback
```

### packages/shared

```
shared/
├── src/
│   ├── api.ts        # API request/response types
│   ├── events.ts     # WebSocket event types
│   ├── types.ts      # Core data types & constants
│   └── index.ts      # Exports
├── package.json
└── tsconfig.json
```

**Key Exports:**

**types.ts:**

```typescript
// Core Types
interface User { id, twitchId, username, displayName, avatar, createdAt }
interface UserSession { userId, username, displayName, avatar, socketId, joinedAt }
interface Session { id, streamerId, streamerName, active, currentDrawerId, activeUsers, createdAt, endedAt? }
interface Point { x, y }
interface DrawingStroke { id, points, color, size, userId, timestamp }
interface Drawing { sessionId, userId, username, strokes, createdAt }

// Constants
COLORS: 10 predefined colors (black, white, red, green, blue, yellow, magenta, cyan, orange, purple)
BRUSH_SIZES: [2, 5, 10, 15, 20, 30]
CANVAS_WIDTH: 1920
CANVAS_HEIGHT: 1080
```

**events.ts:**

```typescript
// Client to Server
interface ClientToServerEvents {
  "viewer:join": { sessionId };
  "streamer:join": { sessionId; token };
  "user:join": { sessionId; token };
  "user:leave": {};
  "drawing:start": { point; color; size };
  "drawing:move": { point };
  "drawing:end": {};
  "canvas:clear": {};
}

// Server to Client
interface ServerToClientEvents {
  "session:updated": { session: SessionUpdate };
  "user:joined": { user: UserSession };
  "user:left": { userId };
  "drawer:changed": { drawerId; username };
  "drawing:stroke-start": { userId; point; color; size };
  "drawing:stroke-move": { userId; point };
  "drawing:stroke-end": { userId; stroke };
  "canvas:cleared": {};
  error: { message };
}
```

**api.ts:**

```typescript
// Request/Response pairs for all REST endpoints
(LoginRequest, LoginResponse);
AuthResponse;
(CreateSessionRequest, CreateSessionResponse);
GetSessionResponse;
(SelectUserRequest, SelectUserResponse);
NextUserResponse;
EndSessionResponse;
ErrorResponse;
```

---

## 🔐 Authentication Flow

### Twitch OAuth Flow

1. **User clicks "Login with Twitch"**
   - Frontend redirects to Twitch OAuth URL
   - URL includes client_id, redirect_uri, response_type=code, scope

2. **User authorizes on Twitch**
   - Twitch redirects back to app with authorization code
   - URL: `http://localhost:5173/auth/callback?code=XXXXXX`

3. **Frontend sends code to backend**
   - POST `/auth/twitch` with `{ code }`

4. **Backend exchanges code for access token**
   - POST to Twitch token endpoint
   - Receives access_token from Twitch

5. **Backend fetches user info from Twitch**
   - GET to Twitch users endpoint with access_token
   - Receives user profile data

6. **Backend creates/updates user in database**
   - Find user by twitchId
   - Create new or update existing user record

7. **Backend generates JWT token**
   - Payload: `{ userId, twitchId, username }`
   - Signs with JWT_SECRET
   - Expires in 7 days

8. **Backend returns JWT + user data**
   - Response: `{ token, user }`

9. **Frontend stores token**
   - localStorage.setItem('token', token)
   - localStorage.setItem('user', JSON.stringify(user))

10. **Frontend uses token for API requests**
    - Authorization header: `Bearer ${token}`

11. **Backend middleware verifies token**
    - Decodes JWT
    - Validates signature
    - Attaches user info to req.user

### Token Structure

**JWT Payload:**

```typescript
{
  userId: string; // MongoDB _id
  twitchId: string; // Twitch user ID
  username: string; // Twitch username
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
}
```

**User Object (Frontend):**

```typescript
{
  id: string; // MongoDB _id
  twitchId: string;
  username: string;
  displayName: string;
  avatar: string;
  createdAt: Date;
}
```

---

## 🎨 Drawing System

### Canvas Architecture

**Canvas Setup:**

- Size: 1920x1080 pixels (16:9 aspect ratio for OBS)
- Background: White
- Coordinate system: Top-left origin (0,0)
- Drawing API: HTML5 Canvas 2D Context

**Drawing Flow:**

1. **User starts drawing** (mousedown/touchstart)

   ```typescript
   onDrawingStart(point, color, size)
   → emit('drawing:start', { point, color, size })
   ```

2. **User moves cursor** (mousemove/touchmove)

   ```typescript
   onDrawingMove(point)
   → emit('drawing:move', { point })
   ```

3. **User stops drawing** (mouseup/touchend)

   ```typescript
   onDrawingEnd()
   → emit('drawing:end')
   ```

4. **Server broadcasts to all clients**

   ```typescript
   io.to(sessionId).emit("drawing:stroke-start", {
     userId,
     point,
     color,
     size,
   });
   io.to(sessionId).emit("drawing:stroke-move", { userId, point });
   io.to(sessionId).emit("drawing:stroke-end", { userId, stroke });
   ```

5. **Clients receive and render**

   ```typescript
   socket.on("drawing:stroke-start", ({ userId, point, color, size }) => {
     // Draw initial point
     ctx.fillStyle = color;
     ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
     ctx.fill();
   });

   socket.on("drawing:stroke-move", ({ userId, point }) => {
     // Draw line from last point to current point
     ctx.strokeStyle = stroke.color;
     ctx.lineWidth = stroke.size;
     ctx.lineTo(point.x, point.y);
     ctx.stroke();
   });
   ```

### Stroke Management

**In-Memory (Server):**

```typescript
// Active strokes during drawing
const activeStrokes = new Map<
  string,
  {
    points: Point[];
    color: string;
    size: number;
    userId: string;
  }
>();
```

**Database Persistence:**

```typescript
// Completed strokes saved to MongoDB
Drawing {
  sessionId: ObjectId;
  userId: string;
  username: string;
  strokes: [{
    id: string;
    points: Point[];
    color: string;
    size: number;
    userId: string;
    timestamp: Date;
  }];
  createdAt: Date;
}
```

**Canvas Clear:**

- Only current drawer can clear canvas
- Deletes all their drawings from database
- Broadcasts `canvas:cleared` event
- All clients clear their canvas

---

## 🔌 WebSocket Implementation Details

### Connection Lifecycle

**Streamer Connection:**

```typescript
// Control App connects
socket.emit("streamer:join", { sessionId, token });

// Server validates
const payload = verifyToken(token);
const session = await Session.findById(sessionId);
if (session.streamerId !== payload.userId) {
  return socket.emit("error", { message: "Not session owner" });
}

// Join room but don't add to activeUsers
socket.join(sessionId);
socket.data = { userId, username, displayName, avatar, sessionId };

// Send initial state
io.to(sessionId).emit("session:updated", { session });
```

**Viewer Connection:**

```typescript
// Overlay App connects
socket.emit("viewer:join", { sessionId });

// Server validates session exists
const session = await Session.findById(sessionId);
if (!session || !session.active) {
  return socket.emit("error", { message: "Session not found" });
}

// Join room (no authentication needed)
socket.join(sessionId);
socket.data = { sessionId };

// Send initial state
io.to(sessionId).emit("session:updated", { session });
```

**Participant Connection (Future):**

```typescript
// Participant App connects
socket.emit("user:join", { sessionId, token });

// Server validates and adds to activeUsers
const payload = verifyToken(token);
const user = await User.findById(payload.userId);

const userSession = {
  userId: payload.userId,
  username: user.username,
  displayName: user.displayName,
  avatar: user.avatar,
  socketId: socket.id,
  joinedAt: new Date(),
};

session.activeUsers.push(userSession);
await session.save();

// Notify all clients
io.to(sessionId).emit("user:joined", { user: userSession });
io.to(sessionId).emit("session:updated", { session });
```

### Drawing Authorization

**Server-side validation:**

```typescript
socket.on("drawing:start", async ({ point, color, size }) => {
  const data = socket.data as SocketData;
  const session = await Session.findById(data.sessionId);

  // Only current drawer can draw
  if (session.currentDrawerId !== data.userId) {
    return socket.emit("error", { message: "Not authorized to draw" });
  }

  // Proceed with drawing
  // ...
});
```

### Disconnection Handling

```typescript
socket.on("disconnect", async () => {
  const data = socket.data as SocketData;
  if (!data?.sessionId) return;

  const session = await Session.findById(data.sessionId);

  // Remove from activeUsers
  session.activeUsers = session.activeUsers.filter(
    (u) => u.socketId !== socket.id,
  );

  // If disconnected user was current drawer, clear it
  if (session.currentDrawerId === data.userId) {
    session.currentDrawerId = null;
  }

  await session.save();

  // Notify others
  io.to(data.sessionId).emit("user:left", { userId: data.userId });
  io.to(data.sessionId).emit("session:updated", { session });
});
```

---

## 🗄️ Database Schema

### MongoDB Collections

**users:**

```javascript
{
  _id: ObjectId,
  twitchId: String (unique, indexed),
  username: String,
  displayName: String,
  avatar: String,
  createdAt: Date (default: now)
}
```

**sessions:**

```javascript
{
  _id: ObjectId,
  streamerId: String (indexed),
  streamerName: String,
  active: Boolean (default: true, indexed),
  currentDrawerId: String | null,
  activeUsers: [{
    userId: String,
    username: String,
    displayName: String,
    avatar: String,
    socketId: String,
    joinedAt: Date
  }],
  createdAt: Date (default: now),
  endedAt: Date (optional)
}

// Compound index: { streamerId: 1, active: 1 }
```

**drawings:**

```javascript
{
  _id: ObjectId,
  sessionId: String (ref: sessions),
  userId: String (ref: users),
  username: String,
  strokes: [{
    id: String,
    points: [{ x: Number, y: Number }],
    color: String,
    size: Number,
    userId: String,
    timestamp: Date
  }],
  createdAt: Date (default: now)
}
```

### Key Queries

**Find active session for streamer:**

```javascript
Session.findOne({ streamerId: userId, active: true });
```

**Get all drawings for session:**

```javascript
Drawing.find({ sessionId: sessionId }).sort({ createdAt: 1 });
```

**Find or create user:**

```javascript
User.findOneAndUpdate(
  { twitchId: twitchUser.id },
  { username, displayName, avatar },
  { upsert: true, new: true },
);
```

---

## 🚀 Development Workflow

### Initial Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd paintwithchat

# 2. Install dependencies
pnpm install

# 3. Build shared package
cd packages/shared
pnpm build
cd ../..

# 4. Setup environment variables
cp .env.example .env
cp packages/control-app/.env.example packages/control-app/.env
cp packages/overlay-app/.env.example packages/overlay-app/.env

# 5. Edit .env files with Twitch credentials

# 6. Start MongoDB
docker-compose up -d

# 7. Start all services
pnpm dev
```

### Running Services

**All services (recommended):**

```bash
pnpm dev
```

**Individual services:**

```bash
pnpm api       # Backend on port 3001
pnpm control   # Control App on port 5173
pnpm overlay   # Overlay App on port 5174
```

### Building for Production

```bash
# Build all packages
pnpm build

# Build individual packages
cd packages/api && pnpm build
cd packages/control-app && pnpm build
cd packages/overlay-app && pnpm build
cd packages/shared && pnpm build
```

### Testing Flow

1. **Start services**: `pnpm dev`
2. **Open Control App**: http://localhost:5173
3. **Login with Twitch**
4. **Start session**
5. **Copy OBS overlay link**
6. **Open Overlay in new tab**: http://localhost:5174?session=SESSION_ID
7. **Verify**: Overlay should show "No drawer yet"
8. **Add Browser Source in OBS**:
   - URL: Overlay link
   - Width: 1920
   - Height: 1080
   - Check "Shutdown source when not visible"
   - Check "Refresh browser when scene becomes active"

### Common Development Tasks

**Add new WebSocket event:**

1. Add to `packages/shared/src/events.ts`
2. Implement handler in `packages/api/src/socket/index.ts`
3. Add listener in `packages/control-app/src/hooks/useSocket.ts` or `packages/overlay-app/src/hooks/useOverlaySocket.ts`

**Add new API endpoint:**

1. Create route in `packages/api/src/routes/`
2. Add request/response types to `packages/shared/src/api.ts`
3. Add API client function in `packages/control-app/src/utils/api.ts`

**Add new UI component:**

1. Create component in `packages/control-app/src/components/`
2. Use shadcn/ui components from `components/ui/`
3. Style with Tailwind CSS classes

**Add new database model:**

1. Create schema in `packages/api/src/models/`
2. Export from `packages/api/src/models/index.ts`
3. Add TypeScript interface to `packages/shared/src/types.ts`

---

## 🎯 Key Features Implementation

### Session Management

**Start Session:**

```typescript
// Control App
POST / session / start;

// Backend creates session
const session = await Session.create({
  streamerId: req.user.userId,
  streamerName: req.user.username,
  active: true,
  currentDrawerId: null,
  activeUsers: [],
});

// Returns session with ID
// Frontend navigates to /session/:id
```

**End Session:**

```typescript
// Control App
POST / session / end;

// Backend updates session
session.active = false;
session.endedAt = new Date();
await session.save();

// All connected clients receive session:updated
// Frontend redirects to dashboard
```

**Select Drawer:**

```typescript
// Random selection
POST /session/next-user
→ Picks random user from activeUsers
→ Updates session.currentDrawerId
→ Broadcasts drawer:changed event

// Manual selection
POST /session/select-user
→ Body: { userId }
→ Updates session.currentDrawerId
→ Broadcasts drawer:changed event
```

### Real-time Updates

**Session State Sync:**

```typescript
// Any session change triggers
io.to(sessionId).emit("session:updated", {
  session: {
    id: session._id,
    currentDrawerId: session.currentDrawerId,
    activeUsers: session.activeUsers,
    active: session.active,
  },
});

// All clients update their local state
const [sessionUpdate, setSessionUpdate] = useState<SessionUpdate | null>(null);

socket.on("session:updated", (data) => {
  setSessionUpdate(data.session);
});

// Components react to sessionUpdate changes
useEffect(() => {
  if (sessionUpdate) {
    setSession((prev) => ({
      ...prev,
      currentDrawerId: sessionUpdate.currentDrawerId,
      activeUsers: sessionUpdate.activeUsers,
      active: sessionUpdate.active,
    }));
  }
}, [sessionUpdate]);
```

### Toast Notifications

**Implementation (Control App):**

```typescript
// packages/control-app/src/main.tsx
import { Toaster } from './components/ui/sonner';

<App>
  <Routes>...</Routes>
  <Toaster />
</App>

// Usage in components
import { toast } from 'sonner';

const handleCopyLink = async () => {
  await navigator.clipboard.writeText(url);
  toast.success('Link copied to clipboard!');
};
```

### Dark Theme

**Control App:**

- Global dark theme via Tailwind
- `index.css` sets dark color scheme
- `html` element has `class="dark"`
- Components use dark-mode Tailwind classes

**Overlay App:**

- Dark theme for status indicators
- Transparent background for OBS
- White canvas for drawings

---

## 🐛 Troubleshooting Guide

### Common Issues

**1. "Maximum update depth exceeded" in useEffect**

**Cause**: Dependencies in useEffect causing infinite re-renders

**Solution**: Use refs for callbacks

```typescript
const handlersRef = useRef(handlers);
useEffect(() => {
  handlersRef.current = handlers;
}, [handlers]);

useEffect(() => {
  socket.on("event", () => {
    handlersRef.current.callback();
  });
}, [socket]); // handlers not in deps
```

**2. WebSocket not connecting**

**Check:**

- API server running on port 3001
- CORS_ORIGIN in .env includes frontend URLs
- No firewall blocking WebSocket connections
- Browser console for connection errors

**Debug:**

```typescript
socket.on("connect", () => console.log("Connected"));
socket.on("connect_error", (err) => console.error("Error:", err));
socket.on("error", (data) => console.error("Socket error:", data));
```

**3. Twitch OAuth redirect loop**

**Cause**: Token not being saved or user fetch failing

**Check:**

- localStorage has 'token' and 'user'
- Token is valid (not expired)
- User object has all required fields
- API /auth/me endpoint returns user data

**Debug:**

```typescript
console.log("Token:", localStorage.getItem("token"));
console.log("User:", localStorage.getItem("user"));
```

**4. Canvas not showing drawings**

**Check:**

- Canvas element has correct dimensions (1920x1080)
- Drawing event handlers are registered
- WebSocket connection is active
- Session has currentDrawerId set
- User is authorized to draw

**Debug:**

```typescript
socket.on("drawing:stroke-start", (data) => {
  console.log("Received stroke:", data);
});
```

**5. MongoDB connection fails**

**Check:**

- MongoDB is running (docker ps or mongosh)
- MONGODB_URI is correct in .env
- No port conflicts on 27017
- Network allows MongoDB connections

**Test:**

```bash
mongosh mongodb://localhost:27017/paintwithchat
```

**6. Build errors in shared package**

**Solution:**

```bash
cd packages/shared
rm -rf dist node_modules
pnpm install
pnpm build
```

**7. Type errors in imports from @paintwithchat/shared**

**Cause**: Shared package not built or stale build

**Solution:**

```bash
cd packages/shared
pnpm build
cd ../..
# Restart dev server
```

---

## 📝 Code Patterns & Best Practices

### React Hooks

**useSocket Pattern:**

```typescript
export const useSocket = (sessionId, token, handlers?) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef(handlers);

  // Update handlers without re-creating socket
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // Create socket connection
  useEffect(() => {
    if (!sessionId || !token) return;

    const newSocket = io(WS_URL);
    newSocket.on("connect", () => {
      setConnected(true);
      newSocket.emit("streamer:join", { sessionId, token });
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [sessionId, token]);

  // Register event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on("event", (data) => {
      handlersRef.current?.onEvent(data);
    });

    return () => {
      socket.off("event");
    };
  }, [socket]);

  return { socket, connected };
};
```

**useAuth Pattern:**

```typescript
export const useAuth = () => {
  const queryClient = useQueryClient();
  const hasToken = !!localStorage.getItem("token");

  // Initial state from localStorage
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // Fetch user if token exists but no user
  const { data, error } = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    enabled: hasToken && !user,
    retry: false,
  });

  // Update user from query
  useEffect(() => {
    if (data) {
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    }
  }, [data]);

  // Clear on error
  useEffect(() => {
    if (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      queryClient.clear();
    }
  }, [error, queryClient]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    queryClient.clear();
  };

  return { user, loading: hasToken && !user, error, logout };
};
```

### Error Handling

**API Calls:**

```typescript
try {
  const response = await api.post("/endpoint", data);
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    throw new Error(error.response?.data?.message || "Request failed");
  }
  throw error;
}
```

**WebSocket Events:**

```typescript
socket.on("error", (data) => {
  console.error("Socket error:", data.message);
  toast.error(data.message);
});
```

### State Management

**Session State:**

```typescript
// Local state for session data
const [session, setSession] = useState<Session | null>(null);

// Query for initial load
const { data } = useQuery({
  queryKey: ["currentSession"],
  queryFn: getCurrentSession,
});

// Update from query
useEffect(() => {
  if (data) setSession(data.session);
}, [data]);

// Update from WebSocket
useEffect(() => {
  if (sessionUpdate) {
    setSession((prev) => ({
      ...prev,
      currentDrawerId: sessionUpdate.currentDrawerId,
      activeUsers: sessionUpdate.activeUsers,
      active: sessionUpdate.active,
    }));
  }
}, [sessionUpdate]);

// Mutations update optimistically
const mutation = useMutation({
  mutationFn: selectNextUser,
  onSuccess: (data) => {
    setSession(data.session);
  },
});
```

### Component Communication

**Parent to Child (Props):**

```typescript
<ViewerCanvas
  onStrokeStart={handleStrokeStart}
  onStrokeMove={handleStrokeMove}
  onStrokeEnd={handleStrokeEnd}
/>
```

**Child to Parent (Callbacks):**

```typescript
<SessionControl
  token={token}
  username={username}
  sessionId={id}
  onConnectionChange={setConnected}
/>
```

**Global State (Context - Not Used):**

- Currently not using React Context
- Consider adding for theme, user, or socket

---

## 🔮 Future Enhancements

### Planned Features

**1. Participant Drawing:**

- Separate participant app or integrate into overlay
- Authenticated users can join sessions
- Drawing tools when selected as current drawer
- Canvas interaction only for current drawer

**2. Chat Integration:**

- Twitch chat integration
- In-app chat for participants
- Drawing requests from chat

**3. Drawing History:**

- Save all drawings per session
- Replay drawing sequences
- Export drawings as images or video

**4. Advanced Tools:**

- Shapes (rectangle, circle, line)
- Eraser tool
- Undo/Redo functionality
- Layers support
- Fill tool

**5. Session Settings:**

- Time limits per drawer
- Automatic drawer rotation
- Drawing prompt/topic
- Scoring system
- Spectator mode

**6. UI Improvements:**

- Keyboard shortcuts
- Touch device optimization
- Mobile responsive design
- Accessibility improvements
- Theme customization

**7. Analytics:**

- Drawing statistics
- User participation metrics
- Session analytics dashboard
- Export data as CSV/JSON

**8. Security:**

- Rate limiting on API
- Drawing flood protection
- Session password protection
- User permissions system

### Technical Improvements

**Performance:**

- Optimize canvas rendering
- Reduce WebSocket message size
- Implement drawing compression
- Add canvas caching

**Testing:**

- Unit tests for API endpoints
- Integration tests for WebSocket
- E2E tests for critical flows
- Component testing for React

**DevOps:**

- Production deployment setup
- CI/CD pipeline
- Monitoring and logging
- Error tracking (Sentry)
- Performance monitoring

**Code Quality:**

- ESLint stricter rules
- Prettier configuration
- Husky pre-commit hooks
- TypeScript strict mode
- Code documentation (JSDoc)

---

## 📚 API Reference

### REST Endpoints

#### Authentication

**POST /auth/twitch**

```typescript
Request:
{
  code: string;  // Twitch OAuth authorization code
}

Response:
{
  token: string;  // JWT token
  user: User;     // User object
}

Errors:
400 - Missing authorization code
500 - Authentication failed
```

**GET /auth/me**

```typescript
Headers:
Authorization: Bearer <token>

Response:
{
  user: User;
}

Errors:
401 - Invalid or missing token
404 - User not found
500 - Failed to get user
```

#### Session Management

**POST /session/start**

```typescript
Headers:
Authorization: Bearer <token>

Response:
{
  session: Session;
}

Errors:
400 - Already has active session
401 - Unauthorized
500 - Failed to start session
```

**GET /session/current**

```typescript
Headers:
Authorization: Bearer <token>

Response:
{
  session: Session | null;
}

Errors:
401 - Unauthorized
500 - Failed to get session
```

**POST /session/next-user**

```typescript
Headers:
Authorization: Bearer <token>

Response:
{
  session: Session;
}

Errors:
400 - No active users
401 - Unauthorized
404 - No active session
500 - Failed to select user
```

**POST /session/select-user**

```typescript
Headers:
Authorization: Bearer <token>

Request:
{
  userId: string;
}

Response:
{
  session: Session;
}

Errors:
400 - Invalid user ID
401 - Unauthorized
404 - No active session or user not found
500 - Failed to select user
```

**POST /session/end**

```typescript
Headers:
Authorization: Bearer <token>

Response:
{
  session: Session;
}

Errors:
401 - Unauthorized
404 - No active session
500 - Failed to end session
```

#### Health Check

**GET /health**

```typescript
Response: {
  status: "ok";
  timestamp: string; // ISO 8601 timestamp
}
```

### WebSocket Events Reference

**Connection Events:**

```typescript
// Client connects and joins
emit("viewer:join", { sessionId: string });
emit("streamer:join", { sessionId: string, token: string });
emit("user:join", { sessionId: string, token: string });

// Client disconnects
emit("user:leave");
on("disconnect");
```

**Session Events:**

```typescript
// Session state updates
on('session:updated', {
  session: {
    id: string;
    currentDrawerId: string | null;
    activeUsers: UserSession[];
    active: boolean;
  }
});

// User joined session
on('user:joined', {
  user: UserSession;
});

// User left session
on('user:left', {
  userId: string;
});

// Drawer changed
on('drawer:changed', {
  drawerId: string;
  username: string;
});
```

**Drawing Events:**

```typescript
// Start new stroke (client → server)
emit("drawing:start", {
  point: { x: number, y: number },
  color: string,
  size: number,
});

// Continue stroke (client → server)
emit("drawing:move", {
  point: { x: number, y: number },
});

// End stroke (client → server)
emit("drawing:end");

// Clear canvas (client → server)
emit("canvas:clear");

// Stroke started (server → clients)
on("drawing:stroke-start", {
  userId: string,
  point: { x: number, y: number },
  color: string,
  size: number,
});

// Stroke moved (server → clients)
on("drawing:stroke-move", {
  userId: string,
  point: { x: number, y: number },
});

// Stroke ended (server → clients)
on("drawing:stroke-end", {
  userId: string,
  stroke: DrawingStroke,
});

// Canvas cleared (server → clients)
on("canvas:cleared");
```

**Error Events:**

```typescript
on('error', {
  message: string;
});
```

---

## 🎨 UI/UX Design Patterns

### Control App Layout

**Navbar:**

- Full width, no container
- Left: "PaintWithChat" logo
- Right: Connected badge, Username, Logout button
- Height: ~73px
- Dark theme (bg-card)

**Session Page:**

- Full height (h-screen)
- Flex column layout
- Navbar (flex-shrink-0)
- Content area (flex-1, overflow-hidden)

**Session Content:**

- Flex row layout
- Sidebar: 320px (w-80), fixed width
- Main content: Remaining space (flex-1)

**Sidebar:**

- Scrollable (overflow-y-auto)
- Padding: 16px (p-4)
- Sections (space-y-4):
  1. Action buttons (Copy links, End session)
  2. Stats cards (Active users, Drawing status)
  3. Controls (Select random user)
  4. Active users list

**Main Content:**

- Padding: 24px (p-6)
- ViewerCanvas fills entire area
- Canvas maintains 16:9 aspect ratio

### Overlay App Layout

**Full Screen:**

- 100vw x 100vh
- Transparent background
- No scrolling

**Status Bar:**

- Position: absolute top center
- Translucent black background
- Shows current drawer name
- Only visible when someone is drawing

**Canvas:**

- Full screen
- No toolbar (view-only)
- Transparent background for OBS

### Color Scheme

**Control App (Dark Theme):**

```css
--background: hsl(222.2, 84%, 4.9%) /* Very dark blue */
  --foreground: hsl(210, 40%, 98%) /* Off-white */ --card: hsl(222.2, 84%, 4.9%)
  /* Dark blue */ --primary: hsl(263, 70%, 50%) /* Purple */
  --secondary: hsl(217.2, 32.6%, 17.5%) /* Dark gray */
  --muted: hsl(217.2, 32.6%, 17.5%) /* Dark gray */
  --destructive: hsl(0, 62.8%, 30.6%) /* Dark red */
  --border: hsl(217.2, 32.6%, 17.5%) /* Dark gray */;
```

**Drawing Colors:**

- Black (#000000)
- White (#FFFFFF)
- Red (#FF0000)
- Green (#00FF00)
- Blue (#0000FF)
- Yellow (#FFFF00)
- Magenta (#FF00FF)
- Cyan (#00FFFF)
- Orange (#FFA500)
- Purple (#800080)

### Component Variants

**Buttons:**

- default: Primary purple
- outline: Transparent with border
- destructive: Red (for End Session)
- secondary: Gray
- ghost: Transparent hover effect

**Badges:**

- default: Primary purple
- secondary: Gray
- destructive: Red
- outline: Transparent with border

**Cards:**

- Background: bg-card
- Border: border
- Rounded corners: rounded-lg
- Shadow: shadow

---

## 🛡️ Security Considerations

### Current Implementation

**Authentication:**

- JWT tokens expire in 7 days
- Tokens stored in localStorage
- Token verification on protected endpoints
- User data cached in localStorage

**Authorization:**

- Only session owner can:
  - End session
  - Select drawers
- Only current drawer can:
  - Send drawing events
  - Clear canvas
- Streamer cannot appear in active users

**WebSocket Security:**

- Token verification for authenticated connections
- Session ownership validation
- Drawing authorization checks
- No sensitive data in messages

### Recommendations for Production

**1. Token Security:**

- Use httpOnly cookies instead of localStorage
- Implement refresh tokens
- Shorter token expiration (1 hour)
- Token rotation on refresh

**2. Rate Limiting:**

- API endpoint rate limits
- WebSocket message rate limits
- Drawing event throttling
- Session creation limits per user

**3. Input Validation:**

- Sanitize all user inputs
- Validate drawing coordinates
- Check color values against whitelist
- Limit stroke point count

**4. Data Protection:**

- HTTPS in production
- Secure WebSocket (WSS)
- Environment variable validation
- Secret rotation policy

**5. CORS:**

- Strict CORS policy
- Whitelist specific origins
- No wildcard origins in production

**6. Session Security:**

- Session timeout
- Maximum active users per session
- Session password option
- Kick user functionality

**7. Monitoring:**

- Log failed auth attempts
- Track suspicious patterns
- Alert on unusual activity
- Audit trail for admin actions

---

## 🚦 Performance Optimization

### Current Optimizations

**Frontend:**

- React.memo for expensive components
- useCallback for event handlers
- useMemo for computed values
- Debouncing mouse events
- Canvas rendering optimizations

**Backend:**

- In-memory stroke management
- Batch database writes
- Index on frequently queried fields
- Connection pooling

**WebSocket:**

- Binary data for coordinates (future)
- Message compression
- Event batching
- Selective broadcasting

### Future Optimizations

**Drawing Performance:**

- Offscreen canvas for layers
- Web Workers for processing
- RequestAnimationFrame for smooth rendering
- Canvas caching strategies
- Delta encoding for strokes

**Network:**

- WebSocket message compression
- Binary protocol for drawing data
- Batch small messages
- Optimize payload size

**Database:**

- Add indexes for common queries
- Implement caching layer (Redis)
- Archive old sessions
- Optimize aggregation queries

**Bundle Size:**

- Code splitting by route
- Lazy load components
- Tree shaking unused code
- Optimize dependencies

---

## 🧪 Testing Strategy

### Recommended Test Coverage

**Unit Tests:**

- API endpoint logic
- Database models
- Utility functions
- Custom hooks
- Pure components

**Integration Tests:**

- WebSocket event flows
- API + Database interactions
- Auth flow end-to-end
- Session lifecycle

**E2E Tests:**

- Complete user journeys
- Drawing synchronization
- Session management
- Multi-user scenarios

**Example Test Structure:**

```typescript
// API endpoint test
describe('POST /session/start', () => {
  it('creates new session for authenticated user', async () => {
    const token = await createTestUser();
    const response = await request(app)
      .post('/session/start')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.session).toHaveProperty('id');
    expect(response.body.session.active).toBe(true);
  });

  it('returns error if user has active session', async () => {
    // ...
  });
});

// WebSocket test
describe('streamer:join event', () => {
  it('allows session owner to join', async () => {
    const { session, token } = await createTestSession();
    const socket = createTestSocket();

    socket.emit('streamer:join', { sessionId: session.id, token });

    await waitFor(() => {
      expect(socket.received('session:updated')).toBeTruthy();
    });
  });
});

// React component test
describe('SessionControl', () => {
  it('renders session controls', () => {
    render(<SessionControl token="test" username="testuser" />);

    expect(screen.getByText('Copy Session Link')).toBeInTheDocument();
    expect(screen.getByText('End Session')).toBeInTheDocument();
  });
});
```

---

## 📦 Deployment Guide

### Environment Setup

**Production Environment Variables:**

```bash
# API (.env)
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/paintwithchat
JWT_SECRET=<strong-random-secret>
TWITCH_CLIENT_ID=<your-client-id>
TWITCH_CLIENT_SECRET=<your-client-secret>
TWITCH_REDIRECT_URI=https://yourdomain.com/auth/callback
CORS_ORIGIN=https://yourdomain.com,https://overlay.yourdomain.com

# Control App (.env)
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
VITE_TWITCH_CLIENT_ID=<your-client-id>
VITE_TWITCH_REDIRECT_URI=https://yourdomain.com/auth/callback

# Overlay App (.env)
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
VITE_TWITCH_CLIENT_ID=<your-client-id>
VITE_TWITCH_REDIRECT_URI=https://overlay.yourdomain.com/auth/callback
```

### Build Process

```bash
# Install dependencies
pnpm install

# Build shared package first
cd packages/shared
pnpm build

# Build all applications
cd ../..
pnpm build

# Outputs:
# packages/api/dist/
# packages/control-app/dist/
# packages/overlay-app/dist/
```

### Deployment Options

**Option 1: Single Server (Simple)**

- Deploy API on port 3001
- Serve control-app and overlay-app as static files
- Use nginx as reverse proxy
- MongoDB on same server or managed service

**Option 2: Separate Services (Recommended)**

- API on dedicated server/container
- Control App on Vercel/Netlify
- Overlay App on Vercel/Netlify
- MongoDB Atlas for database

**Option 3: Docker (Containerized)**

- Create Dockerfiles for each service
- Use docker-compose for orchestration
- Deploy to any container platform

### Nginx Configuration Example

```nginx
# API Server
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Control App
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/control-app/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Overlay App
server {
    listen 80;
    server_name overlay.yourdomain.com;
    root /var/www/overlay-app/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 📖 Additional Documentation Files

**Project includes:**

- `README_DOCKER.md` - Docker setup guide
- `ENV_SETUP.md` - Environment configuration
- `QUICKSTART.md` - Quick start guide
- `SETUP_FIXED.md` - Setup troubleshooting

---

## 🎓 Learning Resources

### Key Technologies to Understand

**For Backend Development:**

- Express.js middleware patterns
- Socket.io rooms and namespaces
- MongoDB schema design
- JWT authentication flow
- OAuth 2.0 authorization code flow

**For Frontend Development:**

- React hooks (useState, useEffect, useRef, useCallback)
- React Router v7 (data routers)
- TanStack Query (formerly React Query)
- HTML5 Canvas API
- WebSocket client patterns

**For Full-Stack Development:**

- Monorepo with pnpm workspaces
- TypeScript shared types
- Real-time event synchronization
- State management patterns

### Useful Commands

```bash
# Development
pnpm dev                    # Start all services
pnpm api                    # Start API only
pnpm control                # Start control app only
pnpm overlay                # Start overlay app only

# Building
pnpm build                  # Build all packages
pnpm clean                  # Remove build artifacts

# MongoDB
docker-compose up -d        # Start MongoDB
docker-compose down         # Stop MongoDB
mongosh                     # Connect to MongoDB shell

# Debugging
pnpm --filter api dev       # API with debug output
pnpm --filter control-app dev  # Control app
pnpm --filter overlay-app dev  # Overlay app
```

---

## 🤝 Contributing Guidelines

### Code Style

- TypeScript strict mode
- ESLint for linting
- Prettier for formatting
- Functional components only (React)
- Prefer hooks over HOCs
- Use const for immutable values

### Git Workflow

1. Create feature branch
2. Make changes
3. Test locally
4. Commit with descriptive message
5. Push and create PR
6. Review and merge

### Commit Message Format

```
type(scope): description

Examples:
feat(api): add session timeout feature
fix(control): resolve drawer selection bug
docs(readme): update setup instructions
refactor(overlay): optimize canvas rendering
```

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👥 Contact & Support

For issues, questions, or contributions:

- Create GitHub issue
- Check existing documentation
- Review troubleshooting guide

---

**Last Updated**: 2024-11-25
**Version**: 1.0.0
**Maintained by**: Development Team
