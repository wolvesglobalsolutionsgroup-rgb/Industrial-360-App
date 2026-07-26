import React from 'react';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  headers: string[];
}

export function Table({
  headers,
  children,
  className = '',
  ...props
}: TableProps) {
  return (
    <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/80 rounded-3xl bg-white/50 dark:bg-slate-950/40 backdrop-blur-md">
      <table className={`w-full border-collapse text-left text-xs sm:text-sm ${className}`} {...props}>
        <thead>
          <tr className="bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/80">
            {headers.map((h, i) => (
              <th key={i} className="px-5 py-3.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`hover:bg-slate-50/45 dark:hover:bg-slate-900/30 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-5 py-3 text-slate-700 dark:text-slate-350 font-medium ${className}`} {...props}>
      {children}
    </td>
  );
}

export default Table;
