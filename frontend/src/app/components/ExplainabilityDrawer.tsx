import { X, Sparkles, TrendingUp, Clock, DollarSign } from 'lucide-react';

interface ExplainabilityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: string;
  leadName: string;
}

export function ExplainabilityDrawer({ isOpen, onClose, explanation, leadName }: ExplainabilityDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-xl text-gray-900">Why This Action Matters</h2>
                <p className="text-sm text-gray-500 mt-1">{leadName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-sm max-w-none">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
              <p className="text-gray-800 leading-relaxed">{explanation}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium text-sm">Priority</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">High</p>
                <p className="text-xs text-gray-500 mt-1">Top 10% of actions</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium text-sm">Urgency</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">Critical</p>
                <p className="text-xs text-gray-500 mt-1">Act within 24hrs</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="font-medium text-sm">Impact</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">Very High</p>
                <p className="text-xs text-gray-500 mt-1">Deal preservation</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">AI Reasoning</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Lead has gone silent for 7 days after property viewing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Statistical data shows 3x higher churn rate after 1 week of no contact</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Pre-approval status indicates serious buyer intent</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Deal value and stage suggest high conversion potential</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Got it, take action
          </button>
        </div>
      </div>
    </div>
  );
}
