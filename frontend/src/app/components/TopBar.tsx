import { Search, User } from 'lucide-react';

interface TopBarProps {
  highPriorityCount: number;
}

export function TopBar({ highPriorityCount }: TopBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads, actions, or deals..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-6 ml-6">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              Today: <span className="text-red-600">{highPriorityCount} high-priority actions</span>
            </div>
            <div className="text-xs text-gray-500">Last updated: just now</div>
          </div>

          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
