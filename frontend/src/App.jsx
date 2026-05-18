import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Cpu, HardDrive, Activity, Wifi, Terminal, Battery } from 'lucide-react';
import Dashboard from './Dashboard';

// Safe access to Electron's ipcRenderer
const electron = window.require ? window.require('electron') : null;
const ipcRenderer = electron ? electron.ipcRenderer : null;

function App() {
  const [metrics, setMetrics] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let ws;
    let reconnectTimeout;

    const connect = () => {
      ws = new WebSocket('ws://localhost:8000/ws/metrics');
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMetrics(data);
        if (data.logs) {
          setLogs(data.logs);
        }
        
        const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
        setHistory(prev => {
          const newHistory = [...prev, { time: timeStr, cpu: data?.cpu?.usage ?? 0, ram: data?.ram?.percent ?? 0 }];
          if (newHistory.length > 20) newHistory.shift();
          return newHistory;
        });
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting in 2 seconds...');
        reconnectTimeout = setTimeout(connect, 2000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Handle dynamic window resizing based on expanded/collapsed state
  useEffect(() => {
    if (ipcRenderer) {
      if (isExpanded) {
        ipcRenderer.send('resize-window', 340, 520);
      } else {
        ipcRenderer.send('resize-window', 340, 130);
      }
    }
  }, [isExpanded]);

  // Handle mouse click-through on transparent margins
  useEffect(() => {
    if (!ipcRenderer) return;

    const handleMouseMove = (event) => {
      // If hover is on a glass-panel, enable interactions. Otherwise, allow click-through.
      const isOverInteractive = event.target.closest('.glass-panel');
      if (isOverInteractive) {
        ipcRenderer.send('set-ignore-mouse-events', false);
      } else {
        ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Logs are now fully managed by the backend
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (!metrics) {
    return (
      <div 
        className="text-white min-h-screen p-4 flex flex-col font-mono bg-transparent"
        onMouseLeave={() => {
          if (ipcRenderer) {
            ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
          }
        }}
      >
        <div className="glass-panel p-4 drag-region flex flex-col gap-2 relative overflow-hidden bg-black/95 border border-neon-cyan/40 shadow-[0_0_20px_rgba(8,247,254,0.15)] rounded-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink"></div>
          
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <Activity className="text-neon-cyan animate-pulse" size={20} />
              <span className="font-orbitron font-bold text-lg tracking-wider text-neon-blue">GuardianOS</span>
            </div>
            <span className="text-[9px] font-bold tracking-widest text-neon-pink px-2 py-0.5 bg-neon-pink/10 rounded border border-neon-pink/30 animate-pulse">OFFLINE</span>
          </div>
          
          <div className="text-center py-2 text-[10px] text-gray-400 font-orbitron tracking-widest animate-pulse mt-1">
            CONNECTING TO SYSTEM BACKEND...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="text-gray-900 min-h-screen p-4 flex flex-col font-mono bg-transparent"
      onMouseLeave={() => {
        if (ipcRenderer) {
          ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
        }
      }}
    >
      
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
            className="no-drag text-xs px-2 py-1 bg-black/5 hover:bg-black/10 rounded border border-black/10 text-gray-700 transition-colors"
          >
            {isExpanded ? 'MINIMIZE' : 'EXPAND'}
          </button>
        </div>

        {/* Mini Stats (Always visible) */}
        <div className="grid grid-cols-5 gap-2 mt-2">
          <StatBox icon={<Cpu size={14}/>} label="CPU" value={`${metrics?.cpu?.usage ?? 0}%`} color="text-neon-cyan" />
          <StatBox icon={<HardDrive size={14}/>} label="RAM" value={`${metrics?.ram?.percent ?? 0}%`} color="text-neon-purple" />
          <StatBox icon={<Wifi size={14}/>} label="NET" value={formatNetworkSpeed(metrics?.network?.download_speed_bytes)} color="text-neon-green" />
          <StatBox icon={<Battery size={14}/>} label="PWR" value={metrics?.battery ? `${metrics.battery.percent}%` : 'AC'} color="text-yellow-400" />
          <StatBox icon={<ShieldAlert size={14}/>} label="AI" value={metrics?.ai_status ?? 'MONITORING'} color="text-neon-pink" />
        </div>
      </motion.div>

      {/* Expanded Dashboard */}
      {isExpanded && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 mt-4 no-drag flex flex-col gap-4 overflow-y-auto"
        >
          <Dashboard metrics={metrics} logs={logs} history={history} />
        </motion.div>
      )}

    </div>
  );
}

// Formats bytes per second dynamically into a compact HUD label
const formatNetworkSpeed = (bytes) => {
  if (!bytes || bytes < 0) return '0 K';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} K`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} M`;
};

const StatBox = ({ icon, label, value, color }) => (
  <div className="flex flex-col items-center justify-center p-2 bg-white/40 rounded border border-gray-300/30 w-full overflow-hidden">
    <div className={`flex items-center gap-1 text-[10px] text-gray-600 whitespace-nowrap`}>
      {icon} <span className="hidden sm:inline">{label}</span>
    </div>
    <div className={`font-orbitron font-bold text-xs truncate w-full text-center ${color}`} title={value}>
      {value}
    </div>
  </div>
);

export default App;
