import { X, Mail, MessageSquare, Sparkles, Send, Copy } from 'lucide-react';
import { useState } from 'react';

interface DraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadName: string;
  initialDraft: string;
  onApprove: (draft: string) => void;
  onSimulate: (draft: string) => void;
}

export function DraftModal({ isOpen, onClose, leadName, initialDraft, onApprove, onSimulate }: DraftModalProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [messageType, setMessageType] = useState<'email' | 'sms'>('email');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-xl text-gray-900">Draft Message</h2>
              <p className="text-sm text-gray-500 mt-1">To: {leadName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setMessageType('email')}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                messageType === 'email'
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                  : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:border-gray-200'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => setMessageType('sms')}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                messageType === 'sms'
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                  : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:border-gray-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              SMS
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Content
            </label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-sans"
              placeholder="Type your message here..."
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{draft.length} characters</span>
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Copy className="w-3 h-3" />
                Copy to clipboard
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-gray-900 mb-1">AI Writing Assistant</p>
                <p className="text-xs text-gray-600">This draft was personalized based on the lead's history, preferences, and current deal stage.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={() => {
                setDraft(initialDraft);
              }}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Regenerate
            </button>

            <div className="flex-1 flex gap-3">
              <button
                onClick={() => {
                  onSimulate(draft);
                  onClose();
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Simulated Send
              </button>
              <button
                onClick={() => {
                  onApprove(draft);
                  onClose();
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Approve & Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
