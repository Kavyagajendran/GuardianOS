import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Cpu, HardDrive, Activity, Wifi, Terminal } from 'lucide-react';
import Dashboard from './Dashboard';

function App() {
  const [metrics, setMetrics] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:8000/ws/metrics');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMetrics(data);
      if (data.logs) {
        setLogs(data.logs);
      }
    };

    return () => ws.close();
  }, []);

  // Logs are now fully managed by the backend
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-screen bg-black/60 drag-region">
        <div className="text-neon-cyan animate-pulse-fast text-2xl font-orbitron">INITIALIZING CORE...</div>
      </div>
    );
  }

  return (
    <div className={`text-white min-h-screen p-4 flex flex-col font-mono transition-all duration-300 ${isExpanded ? 'bg-dark-900/90 backdrop-blur-lg' : 'bg-transparent'}`}>
      
      {/* Draggable Header Widget */}
      <motion.div 
        layout
        className="glass-panel p-4 drag-region cursor-move flex flex-col gap-2 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink"></div>
        
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <Activity className="text-neon-green animate-pulse" size={20} />
            <span className="font-orbitron font-bold text-lg tracking-wider text-neon-blue">GuardianOS</span>
          </div>
          <button 
            onClick={toggleExpand} 
            className="no-drag text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded border border-white/20 transition-colors"
          >
            {isExpanded ? 'MINIMIZE' : 'EXPAND'}
          </button>
        </div>

        {/* Mini Stats (Always visible) */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          <StatBox icon={<Cpu size={14}/>} label="CPU" value={`${metrics.cpu.usage}%`} color="text-neon-cyan" />
          <StatBox icon={<HardDrive size={14}/>} label="RAM" value={`${metrics.ram.percent}%`} color="text-neon-purple" />
          <StatBox icon={<Wifi size={14}/>} label="NET" value={`${(metrics.network.download_speed_bytes / 1024 / 1024).toFixed(1)}M`} color="text-neon-green" />
          <StatBox icon={<ShieldAlert size={14}/>} label="AI" value={metrics.ai_status} color="text-neon-pink" />
        </div>
      </motion.div>

      {/* Expanded Dashboard */}
      {isExpanded && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 mt-4 no-drag flex flex-col gap-4 overflow-y-auto"
        >
          <Dashboard metrics={metrics} logs={logs} />
        </motion.div>
      )}

    </div>
  );
}

const StatBox = ({ icon, label, value, color }) => (
  <div className="flex flex-col items-center justify-center p-2 bg-black/50 rounded border border-white/5">
    <div className={`flex items-center gap-1 text-[10px] text-gray-400`}>
      {icon} {label}
    </div>
    <div className={`font-orbitron font-bold text-sm ${color}`}>
      {value}
    </div>
  </div>
);

export default App;
