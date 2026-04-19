import { Mail, Phone, Clock, Sparkles, Send, Check } from 'lucide-react';
import { useState } from 'react';

export interface LeadDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  dealValue: string;
  stage: string;
  notes: string;
  timeline: Array<{
    type: 'email' | 'call' | 'note';
    content: string;
    date: string;
  }>;
  whyRecommended: string;
  aiDraft: string;
}

interface DetailPanelProps {
  lead: LeadDetail | null;
}

export function DetailPanel({ lead }: DetailPanelProps) {
  const [draftContent, setDraftContent] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);

  if (!lead) {
    return (
      <div className="w-[420px] bg-gray-50 border-l border-gray-200 flex items-center justify-center p-8">
        <div className="text-center text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select an action to view details</p>
        </div>
      </div>
    );
  }

  const currentDraft = draftContent || lead.aiDraft;

  return (
    <div className="w-[420px] bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-1">{lead.name}</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>{lead.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{lead.phone}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-600">Deal Value</span>
          <span className="font-semibold text-gray-900">{lead.dealValue}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-600">Stage</span>
          <span className="text-sm font-medium text-gray-900">{lead.stage}</span>
        </div>
      </div>

      <div className="p-6 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
        <p className="text-sm text-gray-600">{lead.notes}</p>
      </div>

      <div className="p-6 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
        <div className="space-y-3">
          {lead.timeline.map((item, index) => {
            const icons = {
              email: <Mail className="w-4 h-4 text-blue-600" />,
              call: <Phone className="w-4 h-4 text-green-600" />,
              note: <Clock className="w-4 h-4 text-gray-600" />,
            };
            return (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">{icons[item.type]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{item.content}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showExplanation && (
        <div className="p-6 bg-blue-50 border-b border-blue-100">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <h4 className="font-medium text-blue-900">Why This Action Matters</h4>
          </div>
          <p className="text-sm text-blue-800">{lead.whyRecommended}</p>
        </div>
      )}

      <div className="p-6 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">AI-Generated Draft</h4>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            {showExplanation ? 'Hide' : 'Explain Why'}
          </button>
        </div>

        <textarea
          value={currentDraft}
          onChange={(e) => setDraftContent(e.target.value)}
          className="w-full h-40 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="AI draft will appear here..."
        />

        <div className="mt-4 space-y-2">
          <button className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Generate New Draft
          </button>

          <div className="flex gap-2">
            <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              Approve & Send
            </button>
            <button className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              Simulated Send
            </button>
          </div>

          <button className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            Mark Complete
          </button>
        </div>
      </div>
    </div>
  );
}

function AlertCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
