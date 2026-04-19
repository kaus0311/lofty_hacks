import { Mail, Phone, Clock, Sparkles, Send, Check, Edit3, AlertCircle, MapPin, Home, User, DollarSign, Calendar } from 'lucide-react';

export interface LeadDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  dealValue: string;
  budget: string;
  stage: string;
  leadType: string;
  listingAddress?: string;
  propertyType?: string;
  bedrooms?: string;
  bathrooms?: string;
  notes: string;
  timeline: Array<{
    type: 'email' | 'call' | 'note' | 'meeting';
    content: string;
    date: string;
  }>;
  whyRecommended: string;
  aiDraft: string;
}

interface ImprovedDetailPanelProps {
  lead: LeadDetail | null;
  onGenerateDraft: () => void;
  onExplainWhy: () => void;
  onOpenDraftModal: () => void;
  onSimulateSend: () => void;
  onMarkComplete: () => void;
}

export function ImprovedDetailPanel({
  lead,
  onGenerateDraft,
  onExplainWhy,
  onOpenDraftModal,
  onSimulateSend,
  onMarkComplete
}: ImprovedDetailPanelProps) {
  if (!lead) {
    return (
      <div className="w-[440px] bg-gray-50 dark:bg-black border-l border-gray-200 dark:border-gray-800 flex items-center justify-center p-8">
        <div className="text-center text-gray-400 dark:text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Select an action to view details</p>
          <p className="text-sm mt-1">Click any card on the left</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[440px] bg-white dark:bg-black border-l border-gray-200 dark:border-gray-800 flex flex-col h-full overflow-y-auto">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-black">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-xl text-gray-900 dark:text-white">{lead.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {lead.stage}
              </span>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                {lead.leadType}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 text-sm mb-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>{lead.phone}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Deal Value</span>
            </div>
            <div className="font-bold text-gray-900 dark:text-white">{lead.dealValue}</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Budget</span>
            </div>
            <div className="font-bold text-gray-900 dark:text-white">{lead.budget}</div>
          </div>
        </div>
      </div>

      {lead.listingAddress && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Home className="w-4 h-4" />
            Property Details
          </h4>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
              <span>{lead.listingAddress}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Type</div>
                <div className="font-medium text-gray-900 dark:text-white mt-1">{lead.propertyType}</div>
              </div>
              {lead.bedrooms && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Beds</div>
                  <div className="font-medium text-gray-900 dark:text-white mt-1">{lead.bedrooms}</div>
                </div>
              )}
              {lead.bathrooms && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Baths</div>
                  <div className="font-medium text-gray-900 dark:text-white mt-1">{lead.bathrooms}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Agent Notes</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{lead.notes}</p>
      </div>

      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Activity
        </h4>
        <div className="space-y-3">
          {lead.timeline.map((item, index) => {
            const configs = {
              email: { icon: <Mail className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50' },
              call: { icon: <Phone className="w-4 h-4 text-green-600" />, bg: 'bg-green-50' },
              note: { icon: <Clock className="w-4 h-4 text-gray-600" />, bg: 'bg-gray-50' },
              meeting: { icon: <Calendar className="w-4 h-4 text-purple-600" />, bg: 'bg-purple-50' },
            };
            const config = configs[item.type];
            return (
              <div key={index} className="flex gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                <div className={`flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{item.content}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.date}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
        <p className="text-sm text-gray-600 leading-relaxed">{lead.notes}</p>
      </div>

      <div className="p-6 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h4>
        </div>

        <div className="space-y-3">
          <button
            onClick={onOpenDraftModal}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Open Draft Editor
          </button>

          <button
            onClick={onExplainWhy}
            className="w-full px-4 py-3 bg-white border-2 border-purple-200 text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Explain Why This Matters
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onGenerateDraft}
              className="px-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Regenerate
            </button>
            <button
              onClick={onSimulateSend}
              className="px-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Simulate
            </button>
          </div>

          <button
            onClick={onMarkComplete}
            className="w-full px-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Mark Complete
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 leading-relaxed">
              <span className="font-medium">AI Tip:</span> This lead has shown strong buying signals. A personalized follow-up within 24 hours could increase conversion by 40%.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
