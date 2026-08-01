import React from 'react';

export const Table = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className="w-full overflow-x-auto">
    <table className={`w-full text-left border-collapse ${className}`}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <thead>
    <tr className={`bg-surface-2 border-b border-line text-ink-soft text-xs font-bold uppercase tracking-wider ${className}`}>
      {children}
    </tr>
  </thead>
);

export const TableBody = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <tbody className={`divide-y divide-line ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <tr 
    onClick={onClick}
    className={`hover:bg-surface-2/70 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </tr>
);

export const TableHead = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th className={`p-4 font-bold ${className}`}>
    {children}
  </th>
);

export const TableCell = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <td className={`p-4 text-xs sm:text-sm text-ink font-medium ${className}`}>
    {children}
  </td>
);
