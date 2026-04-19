import { DollarSign, User, Clock } from 'lucide-react';
import { LeadDetail } from './ImprovedDetailPanel';

interface PipelineViewProps {
  leads: LeadDetail[];
  onLeadClick: (leadId: string) => void;
  selectedLeadId: string | null;
}

const pipelineStages = [
  { id: 'initial-contact', label: 'Initial Contact', color: 'bg-gray-100' },
  { id: 'showing-scheduled', label: 'Showing Scheduled', color: 'bg-blue-100' },
  { id: 'active-search', label: 'Active Search', color: 'bg-purple-100' },
  { id: 'offer-pending', label: 'Offer Pending', color: 'bg-yellow-100' },
  { id: 'under-contract', label: 'Under Contract', color: 'bg-green-100' },
  { id: 'past-client', label: 'Past Client', color: 'bg-slate-100' },
];

export function PipelineView({ leads, onLeadClick, selectedLeadId }: PipelineViewProps) {
  const normalizeStage = (stage: string): string => {
    return stage.toLowerCase().replace(/\s+/g, '-');
  };

  const getLeadsByStage = (stageId: string) => {
    return leads.filter(lead => normalizeStage(lead.stage) === stageId);
  };

  const getTotalValueByStage = (stageId: string) => {
    const stageLeads = getLeadsByStage(stageId);
    return stageLeads.reduce((total, lead) => {
      const value = parseInt(lead.dealValue.replace(/[$,]/g, '')) || 0;
      return total + value;
    }, 0);
  };

  const formatCurrency = (value: number) => {
    if (value === 0) return '$0';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  const getDaysAgo = (timeline: LeadDetail['timeline']) => {
    if (!timeline || timeline.length === 0) return 'No activity';
    const lastActivity = timeline[0];
    return lastActivity.date;
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="p-6 h-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pipeline</h2>
          <p className="text-sm text-gray-600">Track deals through your sales pipeline</p>
        </div>

        <div className="flex gap-4 h-[calc(100%-5rem)] pb-4">
          {pipelineStages.map((stage) => {
            const stageLeads = getLeadsByStage(stage.id);
            const totalValue = getTotalValueByStage(stage.id);

            return (
              <div
                key={stage.id}
                className="flex-shrink-0 w-80 bg-gray-50 rounded-xl flex flex-col"
              >
                <div className={`p-4 ${stage.color} rounded-t-xl border-b-2 border-gray-200`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{stage.label}</h3>
                    <span className="px-2.5 py-1 bg-white rounded-full text-xs font-bold text-gray-700">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {formatCurrency(totalValue)}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No leads
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const isSelected = selectedLeadId === lead.id;
                      const lastActivity = getDaysAgo(lead.timeline);

                      return (
                        <div
                          key={lead.id}
                          onClick={() => onLeadClick(lead.id)}
                          className={`bg-white rounded-lg p-4 border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate mb-1">
                                {lead.name}
                              </h4>
                              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                {lead.leadType}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2 mb-3">
                            {lead.listingAddress && (
                              <p className="text-xs text-gray-600 truncate">
                                {lead.listingAddress}
                              </p>
                            )}
                            {lead.propertyType && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span>{lead.propertyType}</span>
                                {lead.bedrooms && (
                                  <>
                                    <span>•</span>
                                    <span>{lead.bedrooms}bd</span>
                                  </>
                                )}
                                {lead.bathrooms && (
                                  <>
                                    <span>•</span>
                                    <span>{lead.bathrooms}ba</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1 text-gray-900">
                              <DollarSign className="w-3.5 h-3.5" />
                              <span className="text-sm font-bold">{lead.dealValue}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                            <Clock className="w-3 h-3" />
                            <span>{lastActivity}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
