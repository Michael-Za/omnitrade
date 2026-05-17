import asyncio
import websockets
import json
import requests
import time

BACKEND_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/ws"

def test_endpoints():
    print("Testing REST Endpoints...")
    
    # Root
    try:
        res = requests.get(BACKEND_URL)
        assert res.status_code == 200
        print("✅ Root Endpoint OK")
    except Exception as e:
        print(f"❌ Root Endpoint Failed: {e}")
        return

    # Initialize Bot
    try:
        # Bot ID 1 is VWAP Mean Reversion
        res = requests.post(f"{BACKEND_URL}/api/bots/1/initialize")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        print("✅ Initialize Bot Endpoint OK")
    except Exception as e:
        print(f"❌ Initialize Bot Endpoint Failed: {e}")

async def test_websocket():
    print("Testing WebSocket Stream...")
    try:
        async with websockets.connect(WS_URL) as websocket:
            # Wait for a message
            message = await websocket.recv()
            data = json.loads(message)
            
            # Verify Structure
            scanners = data.get("scanners", {})
            assert "volatility" in scanners
            assert "trend" in scanners
            # New fields from Sheets Service integration check
            # rotation, correlation are added in main.py
            assert "rotation" in scanners
            assert "correlation" in scanners
            
            health = data.get("health")
            mode = data.get("mode")
            
            print(f"✅ Data Structure OK. Health: {health}, Mode: {mode}")
            
            # Verify Mock Data from Sheets (if mock mode active)
            # The mock data for correlation is simple list
            correlation_data = scanners.get("correlation")
            if correlation_data:
                print(f"✅ Correlation Data Received: {correlation_data}")
                
            print("✅ WebSocket Stream Verification Passed")
            
    except Exception as e:
        print(f"❌ WebSocket Stream Failed: {e}")

if __name__ == "__main__":
    time.sleep(3) # Wait for server startup
    test_endpoints()
    asyncio.run(test_websocket())
