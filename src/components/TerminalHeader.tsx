import React from 'react';
import { Terminal } from 'lucide-react';

const TerminalHeader: React.FC = () => {
  return (
    <div className="flex items-center gap-3 mb-8">
      <Terminal className="w-6 h-6 text-terminal-green" />
      <h1 className="text-xl font-mono font-light text-terminal-green">
        hive-challenge-analyzer v1.0.0
      </h1>
    </div>
  );
};

export default TerminalHeader;