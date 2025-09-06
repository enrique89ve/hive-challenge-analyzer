import React from 'react';

interface StatusBarProps {
  readonly status: string;
  readonly timestamp: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ status, timestamp }) => {
  return (
    <div className="mt-8 pt-4 border-t border-terminal-green/20 flex justify-between items-center text-xs font-mono text-terminal-green/50">
      <span>Status: {status}</span>
      <span>{timestamp}</span>
    </div>
  );
};

export default StatusBar;