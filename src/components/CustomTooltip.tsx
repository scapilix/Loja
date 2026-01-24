

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any) => string;
}

export const CustomTooltip = ({ active, payload, label, formatter }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700/50 min-w-[150px] animate-in fade-in zoom-in-95 duration-200">
        <p className="font-bold text-slate-700 dark:text-slate-200 mb-2 text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
            {label}
        </p>
        <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <div 
                        className="w-2 h-2 rounded-full shadow-sm" 
                        style={{ backgroundColor: entry.color || entry.fill }}
                    />
                    <span className="text-slate-500 dark:text-slate-400 font-medium capitalize">
                    {entry.name}:
                    </span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">
                {formatter ? formatter(entry.value) : entry.value}
                </span>
            </div>
            ))}
        </div>
      </div>
    );
  }
  return null;
};
