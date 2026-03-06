# Start up
0. Web login.
1. Add device - Server -> Client (Web) QR -> Client (Mobile) -> Server
1. Mobile ready - Client (Mobile) -> Server (WS create)
2. Create Session - Client (Web) -> Server (REST)
3. Session Created  - Server -> Client(Web)(REST) + Client (Mobile)(WS)
  - Session Id
3. Upload documents - Client (Web) -> Server
4. Start Session - Client (Web) -> Server (WS create)
  - Settings (type, audience size, difficuly level)
5. Session Started - Server -> Client (Web) + Client (Mobile) (WS)

# During session
All communication happens over ws.
- Audio transcript - Server -> Client (Web)
- Audio recording - Client (Mobile) -> Server (As webm Opus or pcm)
- Game events - Client (Mobile) -> Server 
- Smart watch data - Client (Mobile) -> Server

## After speech end
1. Speech End -  Client (Mobile) -> Server -> Client (Web)
2. Questions - Server -> Client (Web) + Client (Mobile)

## For each question
1. Answer start - Client (Mobile) -> Server 
2. Audio recording - Client (Mobile) -> Server (As webm Opus or pcm)
3. Answer end - Client (Mobile) -> Server 

## After questions end
1. Questions End - Client (Mobile) -> Server -> Client (Web)
2. Results - Server -> Client (Web)

# Format

## Json Message
{"type": "message_type", data: ...}
