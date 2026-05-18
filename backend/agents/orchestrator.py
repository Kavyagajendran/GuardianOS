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
        self.current_suggestion = "Monitoring system state..."
        
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

Provide a ONE sentence actionable suggestion or observation about the current processes or system state. Be concise and authoritative."""
            
            if self.client:
                try:
                    response = self.client.chat.completions.create(
                        messages=[{"role": "user", "content": prompt}],
                        model="llama-3.3-70b-versatile",
                        max_tokens=50,
                        temperature=0.3
                    )
                    self.current_suggestion = response.choices[0].message.content.strip()
                    self.add_log("GuardianOS LLM", self.current_suggestion)
                except Exception as e:
                    self.current_suggestion = f"LLM Analysis failed: {str(e)}"
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
            "llm_suggestion": self.current_suggestion
        }

# Global singleton
os_ai = AIOperatingSystem()

