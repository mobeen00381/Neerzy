import React from 'react';
import Image from 'next/image';

interface ScreenshotProps {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function Screenshot({ src, alt, caption, width = 1200, height = 800, priority = false }: ScreenshotProps) {
  return (
    <figure className="my-10 w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 flex flex-col items-center">
      <div className="w-full relative bg-gray-100 flex items-center justify-center p-4">
        <div className="relative w-full rounded-lg overflow-hidden border border-gray-200 shadow-md">
           {/* If src is empty (placeholder), render a stylized placeholder */}
           {src ? (
             <Image 
                src={src}
                alt={alt}
                width={width}
                height={height}
                className="w-full h-auto object-cover"
                priority={priority}
             />
           ) : (
             <div className="w-full h-64 bg-slate-200 flex flex-col items-center justify-center text-slate-500">
                <span className="font-semibold text-lg">{alt}</span>
                <span className="text-sm mt-2">(Screenshot Placeholder)</span>
             </div>
           )}
        </div>
      </div>
      {caption && (
        <figcaption className="p-4 text-center text-sm text-gray-600 border-t border-gray-200 bg-white w-full">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
