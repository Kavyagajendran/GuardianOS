import psutil
import time

def get_system_metrics():
    # CPU
    cpu_percent = psutil.cpu_percent(interval=None)
    cpu_freq = psutil.cpu_freq()
    
    # RAM
    ram = psutil.virtual_memory()
    
    # Network (Calculate speed by delta)
    net_io_1 = psutil.net_io_counters()
    time.sleep(0.1) # Small delay to calculate speed
    net_io_2 = psutil.net_io_counters()
    
    bytes_sent = net_io_2.bytes_sent - net_io_1.bytes_sent
    bytes_recv = net_io_2.bytes_recv - net_io_1.bytes_recv
    
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
            "upload_speed_bytes": bytes_sent * 10,
            "download_speed_bytes": bytes_recv * 10
        },
        "gpu": gpu_stats,
        "processes": top_processes,
        "ai_status": "MONITORING", # Dummy status for now
    }
