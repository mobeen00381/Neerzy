import React from 'react';
import { AlertCircle, CheckCircle2, Info, Lightbulb, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type CalloutType = 'tip' | 'warning' | 'best-practice' | 'important' | 'success';

interface CalloutBoxProps {
  type: CalloutType;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function CalloutBox({ type, title, children, className }: CalloutBoxProps) {
  const config = {
    'tip': {
      icon: <Lightbulb className="w-5 h-5 text-blue-500" />,
      bg: 'bg-blue-50 border-blue-200',
      titleColor: 'text-blue-800',
    },
    'warning': {
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      bg: 'bg-red-50 border-red-200',
      titleColor: 'text-red-800',
    },
    'best-practice': {
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      bg: 'bg-green-50 border-green-200',
      titleColor: 'text-green-800',
    },
    'important': {
      icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
      bg: 'bg-orange-50 border-orange-200',
      titleColor: 'text-orange-800',
    },
    'success': {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      bg: 'bg-emerald-50 border-emerald-200',
      titleColor: 'text-emerald-800',
    }
  };

  const { icon, bg, titleColor } = config[type] || config['tip'];

  return (
    <div className={twMerge(clsx('my-8 border rounded-lg p-5 flex items-start gap-4', bg), className)}>
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1">
        <h4 className={clsx('font-semibold text-lg mb-2', titleColor)}>{title}</h4>
        <div className="text-gray-700 leading-relaxed text-base">
          {children}
        </div>
      </div>
    </div>
  );
}
