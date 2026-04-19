import { AlertCircle } from 'lucide-react';

export interface ActionData {
  id: string;
  priority: number;
  health: 'green' | 'yellow' | 'red';
  leadName: string;
  actionTitle: string;
  reason: string;
  lastTouchDays: number;
  stage: string;
}

interface ActionCardProps {
  action: ActionData;
  isSelected: boolean;
  onClick: () => void;
}

export function ActionCard({ action, isSelected, onClick }: ActionCardProps) {
  const healthColors = {
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    red: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full bg-white rounded-xl p-5 border-2 transition-all text-left ${
        isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-semibold">
            #{action.priority}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-gray-900">{action.leadName}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${healthColors[action.health]}`}>
              {action.health.toUpperCase()}
            </span>
          </div>

          <h3 className="font-medium text-gray-900 mb-1">{action.actionTitle}</h3>
          <p className="text-sm text-gray-600 mb-3">{action.reason}</p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Last touch: {action.lastTouchDays}d ago</span>
            <span>•</span>
            <span>{action.stage}</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <button className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            Why this?
          </button>
        </div>
      </div>
    </button>
  );
}
