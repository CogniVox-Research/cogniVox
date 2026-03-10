import requests
import json

url = "http://127.0.0.1:8005/api/v1/generate-stress-management-plan"

payload = {
    "avg_stress": 45.5,
    "max_stress": 80.2,
    "high_stress_events": 3,
    "duration_seconds": 120.0
}

try:
    print(f"Testing the endpoint at {url}...")
    response = requests.post(url, json=payload, timeout=30)
    response.raise_for_status()
    data = response.json()
    print("\n--- Success! Generated Plan ---\n")
    print(data.get("plan", "No plan found in response"))
except requests.exceptions.ConnectionError:
    print(f"Error: Connection refused. Is the LLM service running on port 8000?")
except requests.exceptions.HTTPError as e:
    print(f"HTTP Error: {e}")
    try:
        print(f"Details: {response.json()}")
    except:
        print(f"Raw text: {response.text}")
except Exception as e:
    print(f"Unexpected error: {e}")
