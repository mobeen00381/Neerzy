import React from 'react';
import { clsx } from 'clsx';

interface Column {
  header: string;
  accessor: string;
  highlight?: boolean;
}

interface ComparisonTableProps {
  title?: string;
  columns: Column[];
  data: Record<string, any>[];
}

export function ComparisonTable({ title, columns, data }: ComparisonTableProps) {
  return (
    <div className="my-10 w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      {title && (
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((col, idx) => (
                <th 
                  key={col.accessor} 
                  className={clsx(
                    'px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200',
                    col.highlight ? 'bg-blue-50 text-blue-900' : ''
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                {columns.map((col, colIdx) => (
                  <td 
                    key={col.accessor} 
                    className={clsx(
                      'px-6 py-4 text-sm text-gray-800 whitespace-normal leading-relaxed',
                      col.highlight ? 'bg-blue-50/50 font-medium' : ''
                    )}
                  >
                    {row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
