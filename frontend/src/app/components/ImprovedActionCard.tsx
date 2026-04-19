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

interface ImprovedActionCardProps {
  action: ActionData;
  isSelected: boolean;
  onClick: () => void;
  onWhyClick: () => void;
}

export function ImprovedActionCard({ action, isSelected, onClick, onWhyClick }: ImprovedActionCardProps) {
  const healthConfig = {
    green: {
      emoji: '🟢',
      label: 'Healthy',
      border: 'border-green-200',
      bg: 'bg-green-50',
    },
    yellow: {
      emoji: '🟡',
      label: 'Needs attention',
      border: 'border-yellow-200',
      bg: 'bg-yellow-50',
    },
    red: {
      emoji: '🔴',
      label: 'High risk',
      border: 'border-red-200',
      bg: 'bg-red-50',
    },
  };

  const config = healthConfig[action.health];

  return (
    <div
      onClick={onClick}
      className={`w-full bg-white dark:bg-gray-950 rounded-xl p-5 border-2 transition-all cursor-pointer relative ${
        isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="absolute top-4 right-4">
        <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.border} border flex items-center gap-1.5`}>
          <span>{config.emoji}</span>
          <span className="text-gray-700">{config.label}</span>
        </div>
      </div>

      <div className="flex items-start gap-4 pr-32">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
            action.priority <= 3 ? 'bg-red-500 text-white' : 'bg-blue-50 text-blue-600'
          }`}>
            #{action.priority}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-lg text-gray-900 dark:text-white">{action.leadName}</span>
          </div>

          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{action.actionTitle}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{action.reason}</p>

          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">Last touch: <span className="text-gray-900 dark:text-gray-100">{action.lastTouchDays}d ago</span></span>
            <span>•</span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded text-gray-700 dark:text-gray-300 font-medium">{action.stage}</span>
          </div>

          <div className="mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWhyClick();
              }}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Why this matters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
