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
    <tr className={`bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider ${className}`}>
      {children}
    </tr>
  </thead>
);

export const TableBody = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <tbody className={`divide-y divide-slate-100 dark:divide-slate-800/60 ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <tr 
    onClick={onClick}
    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
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
  <td className={`p-4 text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium ${className}`}>
    {children}
  </td>
);
