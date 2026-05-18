import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from services.metrics import get_system_metrics
from agents.orchestrator import os_ai

app = FastAPI(title="GuardianOS vNext API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active websocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.get("/")
def read_root():
    return {"status": "GuardianOS Backend is running"}

@app.websocket("/ws/metrics")
async def websocket_metrics(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            metrics = get_system_metrics()
            
            # Run AI Analysis
            ai_data = os_ai.analyze_metrics(metrics)
            metrics["ai_status"] = ai_data["status"]
            metrics["logs"] = ai_data["recent_logs"]
            
            await websocket.send_json(metrics)
            await asyncio.sleep(1) # Send metrics every 1 second
    except WebSocketDisconnect:
        manager.disconnect(websocket)
