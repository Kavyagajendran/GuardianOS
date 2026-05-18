import time
import random
from groq import Groq

import os

# Use the provided API Key from environment or empty string
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

class AIOperatingSystem:
    def __init__(self):
        self.state = "IDLE"
        self.logs = []
        self.last_analysis = time.time()
        self.client = None
        try:
            self.client = Groq(api_key=GROQ_API_KEY)
        except Exception as e:
            print(f"Failed to initialize Groq: {e}")
        self.current_ai_data = {
            "suggestion": "Monitoring system state...",
            "threat": {"risk": "LOW", "description": "System operating normally."},
            "optimization": {"status": "ACTIVE", "description": "No optimizations required."}
        }
        
    def add_log(self, agent, message):
        timestamp = time.strftime('%H:%M:%S')
        self.logs.append(f"[{timestamp}] [{agent}] {message}")
        if len(self.logs) > 20:
            self.logs.pop(0)

    def analyze_metrics(self, metrics):
        current_time = time.time()
        
        # Run LLM deep analysis every 15 seconds to avoid rate limiting
        if current_time - self.last_analysis > 15:
            self.last_analysis = current_time
            
            cpu = metrics.get('cpu', {}).get('usage', 0)
            ram = metrics.get('ram', {}).get('percent', 0)
            processes = metrics.get('processes', [])
            
            # Format top 5 processes for the LLM prompt
            top_procs = "\n".join([f"- {p['name']} (RAM: {p['ram_mb']:.1f} MB, CPU: {p['cpu']}%)" for p in processes[:5]])
            
            prompt = f"""You are GuardianOS, an advanced AI system monitor.
Current System State:
- CPU Usage: {cpu}%
- RAM Usage: {ram}%
Top Processes:
{top_procs}

Analyze the system state and respond ONLY with a valid JSON object matching this exact structure:
{{
  "suggestion": "ONE sentence actionable suggestion or observation about the current processes or system state.",
  "threat": {{
    "risk": "LOW or MEDIUM or HIGH",
    "description": "Short description of any potential threats or anomalies based on the running processes and network."
  }},
  "optimization": {{
    "status": "OPTIMIZATION or CLEANING or MONITORING",
    "description": "Short description of what could be optimized right now."
  }}
}}"""
            
            if self.client:
                try:
                    response = self.client.chat.completions.create(
                        messages=[{"role": "user", "content": prompt}],
                        model="llama-3.3-70b-versatile",
                        max_tokens=300,
                        temperature=0.3,
                        response_format={"type": "json_object"}
                    )
                    content = response.choices[0].message.content.strip()
                    import json
                    parsed = json.loads(content)
                    self.current_ai_data = parsed
                    self.add_log("GuardianOS LLM", parsed.get("suggestion", "System analyzed."))
                except Exception as e:
                    self.current_ai_data["suggestion"] = f"LLM Analysis failed: {str(e)}"
                    self.add_log("Error Agent", f"Groq API Error: {str(e)}")
            
            if cpu > 85:
                self.state = "OPTIMIZING"
            elif ram > 90:
                self.state = "CLEANING"
            else:
                self.state = "MONITORING"

        return {
            "status": self.state,
            "recent_logs": self.logs[-5:],
            "ai_data": self.current_ai_data
        }

# Global singleton
os_ai = AIOperatingSystem()

