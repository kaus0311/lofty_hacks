import { Mail, Phone, DollarSign, MapPin, Search } from 'lucide-react';
import { LeadDetail } from './ImprovedDetailPanel';

interface LeadsViewProps {
  leads: LeadDetail[];
  onLeadClick: (leadId: string) => void;
  selectedLeadId: string | null;
}

export function LeadsView({ leads, onLeadClick, selectedLeadId }: LeadsViewProps) {
  const getHealthBadge = (leadType: string, stage: string) => {
    if (stage === 'Under Contract' || stage === 'Offer Pending') {
      return { emoji: '🟢', label: 'Healthy', bg: 'bg-green-50', border: 'border-green-200' };
    }
    if (stage === 'Showing Scheduled' || stage === 'Active Search') {
      return { emoji: '🟡', label: 'Needs attention', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    }
    return { emoji: '🔴', label: 'High risk', bg: 'bg-red-50', border: 'border-red-200' };
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">All Leads</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage and track all your active and past leads</p>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads by name, email, or property..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {leads.map((lead) => {
            const health = getHealthBadge(lead.leadType, lead.stage);
            const isSelected = selectedLeadId === lead.id;

            return (
              <div
                key={lead.id}
                onClick={() => onLeadClick(lead.id)}
                className={`bg-white dark:bg-gray-950 rounded-xl p-5 border-2 transition-all cursor-pointer ${
                  isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{lead.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {lead.stage}
                      </span>
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {lead.leadType}
                      </span>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1.5 rounded-full text-xs font-medium ${health.bg} ${health.border} border flex items-center gap-1.5 flex-shrink-0 ml-2`}>
                    <span>{health.emoji}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{lead.phone}</span>
                  </div>
                  {lead.listingAddress && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{lead.listingAddress}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-medium">{lead.dealValue}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Budget: <span className="font-medium text-gray-700">{lead.budget}</span>
                  </div>
                </div>

                {lead.propertyType && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="font-medium">{lead.propertyType}</span>
                      {lead.bedrooms && (
                        <>
                          <span>•</span>
                          <span>{lead.bedrooms} bed</span>
                        </>
                      )}
                      {lead.bathrooms && (
                        <>
                          <span>•</span>
                          <span>{lead.bathrooms} bath</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {leads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No leads found</p>
          </div>
        )}
      </div>
    </div>
  );
}
