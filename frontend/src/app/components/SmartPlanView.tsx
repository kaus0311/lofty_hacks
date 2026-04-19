import { Sparkles, TrendingUp, Target, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { LeadDetail } from './ImprovedDetailPanel';

interface SmartPlanViewProps {
  leads: LeadDetail[];
  onLeadClick: (leadId: string) => void;
}

interface PlanItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: string;
  impact: string;
  relatedLeads: string[];
  category: 'outreach' | 'follow-up' | 'nurture' | 'closing';
}

export function SmartPlanView({ leads, onLeadClick }: SmartPlanViewProps) {
  const mockPlanItems: PlanItem[] = [
    {
      id: '1',
      title: 'Urgent Follow-ups',
      description: 'Reach out to 3 high-value leads who have gone silent after property showings. Statistical data shows following up within 7 days increases conversion by 45%.',
      priority: 'high',
      timeframe: 'Today',
      impact: 'High conversion potential - $1.5M in deals',
      relatedLeads: ['1', '3'],
      category: 'follow-up',
    },
    {
      id: '2',
      title: 'Close Pending Offers',
      description: 'Two offers are pending final documentation. Proactively coordinate with lenders and title companies to accelerate closing timeline.',
      priority: 'high',
      timeframe: 'This week',
      impact: '$1.16M in commissions at risk',
      relatedLeads: ['2', '5'],
      category: 'closing',
    },
    {
      id: '3',
      title: 'Market Updates to Active Buyers',
      description: 'Send personalized market updates to 2 active buyers. New listings matching their criteria have hit the market in the last 48 hours.',
      priority: 'medium',
      timeframe: 'Next 2 days',
      impact: 'First-mover advantage on new inventory',
      relatedLeads: ['4'],
      category: 'outreach',
    },
    {
      id: '4',
      title: 'Referral Outreach',
      description: 'Reconnect with past clients who closed 1+ years ago. They are statistically likely to provide referrals and may be ready for their next move.',
      priority: 'medium',
      timeframe: 'This week',
      impact: 'Potential for 2-3 warm referrals',
      relatedLeads: ['6'],
      category: 'nurture',
    },
    {
      id: '5',
      title: 'Pre-approval Check-ins',
      description: 'Verify pre-approval status for leads in active search phase. Expired or outdated pre-approvals can delay offers and lose deals.',
      priority: 'low',
      timeframe: 'Next week',
      impact: 'Prevent deal delays and lost opportunities',
      relatedLeads: ['1', '4'],
      category: 'follow-up',
    },
  ];

  const getPriorityConfig = (priority: string) => {
    const configs = {
      high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'High Priority' },
      medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', label: 'Medium Priority' },
      low: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'Low Priority' },
    };
    return configs[priority as keyof typeof configs];
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      outreach: <Target className="w-4 h-4" />,
      'follow-up': <AlertCircle className="w-4 h-4" />,
      nurture: <TrendingUp className="w-4 h-4" />,
      closing: <CheckCircle2 className="w-4 h-4" />,
    };
    return icons[category as keyof typeof icons];
  };

  const getRelatedLeadNames = (leadIds: string[]) => {
    return leadIds.map(id => {
      const lead = leads.find(l => l.id === id);
      return lead ? lead.name : '';
    }).filter(Boolean);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Plan</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">AI-powered recommendations to maximize your productivity and close more deals</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Focus Score</span>
            </div>
            <div className="text-3xl font-bold mb-1">87%</div>
            <p className="text-xs opacity-75">You're focusing on the right priorities</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">This Week's Goal</span>
            </div>
            <div className="text-3xl font-bold mb-1">5/8</div>
            <p className="text-xs opacity-75">High-priority actions completed</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Revenue at Risk</span>
            </div>
            <div className="text-3xl font-bold mb-1">$2.7M</div>
            <p className="text-xs opacity-75">Act now to protect these deals</p>
          </div>
        </div>

        <div className="max-w-5xl space-y-4">
          {mockPlanItems.map((item) => {
            const priorityConfig = getPriorityConfig(item.priority);
            const relatedLeadNames = getRelatedLeadNames(item.relatedLeads);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-950 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-lg ${priorityConfig.bg} flex items-center justify-center flex-shrink-0 border ${priorityConfig.border}`}>
                      {getCategoryIcon(item.category)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{item.title}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityConfig.bg} ${priorityConfig.text} border ${priorityConfig.border}`}>
                          {priorityConfig.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{item.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">{item.timeframe}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <TrendingUp className="w-4 h-4" />
                          <span>{item.impact}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {relatedLeadNames.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Related Leads</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {relatedLeadNames.map((name, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const leadId = item.relatedLeads[index];
                            onLeadClick(leadId);
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
