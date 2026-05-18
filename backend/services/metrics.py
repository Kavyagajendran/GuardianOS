import psutil
import time

# Global cache to track network speed precisely by elapsed time delta
_last_net_time = 0
_last_bytes_sent = 0
_last_bytes_recv = 0

def get_system_metrics():
    global _last_net_time, _last_bytes_sent, _last_bytes_recv
    
    # CPU
    cpu_percent = psutil.cpu_percent(interval=None)
    cpu_freq = psutil.cpu_freq()
    
    # RAM
    ram = psutil.virtual_memory()
    
    # Network (Calculate speed by precise time delta)
    net_io = psutil.net_io_counters()
    current_time = time.time()
    
    if _last_net_time == 0:
        bytes_sent = 0
        bytes_recv = 0
    else:
        time_delta = current_time - _last_net_time
        if time_delta <= 0:
            time_delta = 0.001 # Prevent division by zero
        bytes_sent = int((net_io.bytes_sent - _last_bytes_sent) / time_delta)
        bytes_recv = int((net_io.bytes_recv - _last_bytes_recv) / time_delta)
        
    _last_net_time = current_time
    _last_bytes_sent = net_io.bytes_sent
    _last_bytes_recv = net_io.bytes_recv
    
    # Processes
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'memory_info', 'cpu_percent']):
        try:
            mem_info = proc.info['memory_info']
            if mem_info:
                processes.append({
                    "pid": proc.info['pid'],
                    "name": proc.info['name'],
                    "ram_mb": mem_info.rss / (1024 * 1024),
                    "cpu": proc.info['cpu_percent']
                })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
            
    # Sort processes by RAM usage
    processes = sorted(processes, key=lambda p: p['ram_mb'], reverse=True)
    top_processes = processes[:15]
    
    # Optional GPU (requires GPUtil, skipping if not installed)
    gpu_stats = []
    try:
        import GPUtil
        gpus = GPUtil.getGPUs()
        for g in gpus:
            gpu_stats.append({
                "id": g.id,
                "name": g.name,
                "load": g.load * 100,
                "temp": g.temperature,
                "memoryTotal": g.memoryTotal,
                "memoryUsed": g.memoryUsed
            })
    except ImportError:
        pass
        
    # Battery
    battery_stats = None
    try:
        if hasattr(psutil, 'sensors_battery'):
            batt = psutil.sensors_battery()
            if batt:
                battery_stats = {
                    "percent": batt.percent,
                    "plugged": batt.power_plugged,
                    "secsleft": batt.secsleft
                }
    except Exception:
        pass
        
    return {
        "timestamp": time.time(),
        "cpu": {
            "usage": cpu_percent,
            "freq_current": cpu_freq.current if cpu_freq else 0,
            "cores": psutil.cpu_count(logical=True)
        },
        "ram": {
            "total": ram.total,
            "used": ram.used,
            "percent": ram.percent
        },
        "network": {
            "upload_speed_bytes": bytes_sent,
            "download_speed_bytes": bytes_recv
        },
        "gpu": gpu_stats,
        "battery": battery_stats,
        "processes": top_processes,
        "ai_status": "MONITORING", # Dummy status for now
    }
