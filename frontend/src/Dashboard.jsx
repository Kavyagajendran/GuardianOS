import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Terminal } from 'lucide-react';

function Dashboard({ metrics, logs, history }) {
  return (
    <div className="flex flex-col gap-4">
      
      {/* Grid for graphs and info */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Graph Panel */}
        <div className="glass-panel p-4 neon-border">
          <h3 className="font-orbitron text-sm text-neon-blue mb-2">System Load History</h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <XAxis dataKey="time" stroke="#555" fontSize={10} />
                <YAxis stroke="#555" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                <Line type="monotone" dataKey="cpu" stroke="#00f3ff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ram" stroke="#bc13fe" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Analysis Panel */}
        <div className="glass-panel p-4 border border-gray-300/30">
          <h3 className="font-orbitron text-sm text-neon-pink mb-2">Threat Intelligence</h3>
          <div className="flex flex-col gap-2">
            <div className={`bg-white/40 p-2 rounded border ${metrics.ai_data?.threat?.risk === 'HIGH' ? 'border-red-500' : 'border-red-500/30'}`}>
              <span className={`text-xs font-bold block mb-1 ${metrics.ai_data?.threat?.risk === 'HIGH' ? 'text-red-500' : 'text-red-400'}`}>RISK: {metrics.ai_data?.threat?.risk || 'UNKNOWN'}</span>
              <p className="text-[10px] text-gray-700">{metrics.ai_data?.threat?.description || 'Awaiting intelligence...'}</p>
            </div>
            <div className="bg-white/40 p-2 rounded border border-neon-green/30">
              <span className="text-neon-green text-xs font-bold block mb-1">{metrics.ai_data?.optimization?.status || 'OPTIMIZATION'}</span>
              <p className="text-[10px] text-gray-700">{metrics.ai_data?.optimization?.description || 'Awaiting optimization data...'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Activity Feed */}
      <div className="glass-panel p-4 border border-gray-300/30 flex-1 min-h-[150px]">
        <div className="flex items-center gap-2 mb-2">
          <Terminal size={16} className="text-neon-purple" />
          <h3 className="font-orbitron text-sm text-neon-purple">Agent Activity Feed</h3>
        </div>
        <div className="bg-white/50 p-2 h-32 overflow-y-auto rounded font-mono text-xs flex flex-col gap-1 shadow-inner">
          {logs.length === 0 ? (
            <span className="text-gray-500 italic">Waiting for agent activity...</span>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`${log.includes('Security') ? 'text-red-400' : 'text-neon-cyan'}`}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
