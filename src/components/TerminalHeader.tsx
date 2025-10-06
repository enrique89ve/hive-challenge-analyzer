import React from 'react';
import { Terminal } from 'lucide-react';
import hiveLogo from '../assets/images/horizontal.svg';

const TerminalHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between gap-3 mb-8">
      <div className="flex items-center gap-3">
        <Terminal className="w-6 h-6 text-terminal-green" />
        <h1 className="text-xl font-mono font-light text-terminal-green">
          hive-challenge-analyzer v1.0.0
        </h1>
      </div>
      <img
        src={hiveLogo}
        alt="Hive Logo"
        className="h-6 w-auto opacity-90 hover:opacity-100 transition-opacity"
      />
    </div>
  );
};

export default TerminalHeader;