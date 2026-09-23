import React from 'react';

export const Input = React.forwardRef(({ className, icon, type = "text", ...props }, ref) => {
  return (
    <div className="relative w-full">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
          {icon}
        </div>
      )}
      <input
        type={type}
        className={`w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 ${
          icon ? 'pl-11' : ''
        } ${className || ''}`}
        ref={ref}
        {...props}
      />
    </div>
  );
});
Input.displayName = 'Input';

