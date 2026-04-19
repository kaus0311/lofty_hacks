import { Mail, Phone, Clock, Calendar, Filter, Search } from 'lucide-react';
import { LeadDetail } from './ImprovedDetailPanel';

interface ActivityViewProps {
  leads: LeadDetail[];
  onLeadClick: (leadId: string) => void;
}

interface ActivityItem {
  id: string;
  leadId: string;
  leadName: string;
  type: 'email' | 'call' | 'note' | 'meeting';
  content: string;
  date: string;
  dealValue: string;
  stage: string;
}

export function ActivityView({ leads, onLeadClick }: ActivityViewProps) {
  const getAllActivities = (): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    leads.forEach(lead => {
      lead.timeline.forEach((activity, index) => {
        activities.push({
          id: `${lead.id}-${index}`,
          leadId: lead.id,
          leadName: lead.name,
          type: activity.type,
          content: activity.content,
          date: activity.date,
          dealValue: lead.dealValue,
          stage: lead.stage,
        });
      });
    });

    return activities;
  };

  const activities = getAllActivities();

  const getActivityConfig = (type: string) => {
    const configs = {
      email: {
        icon: <Mail className="w-5 h-5 text-blue-600" />,
        bg: 'bg-blue-50',
        label: 'Email',
        color: 'text-blue-600'
      },
      call: {
        icon: <Phone className="w-5 h-5 text-green-600" />,
        bg: 'bg-green-50',
        label: 'Call',
        color: 'text-green-600'
      },
      note: {
        icon: <Clock className="w-5 h-5 text-gray-600" />,
        bg: 'bg-gray-50',
        label: 'Note',
        color: 'text-gray-600'
      },
      meeting: {
        icon: <Calendar className="w-5 h-5 text-purple-600" />,
        bg: 'bg-purple-50',
        label: 'Meeting',
        color: 'text-purple-600'
      },
    };
    return configs[type as keyof typeof configs] || configs.note;
  };

  const groupActivitiesByDate = (activities: ActivityItem[]) => {
    const grouped: { [key: string]: ActivityItem[] } = {};

    activities.forEach(activity => {
      const dateKey = activity.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });

    return grouped;
  };

  const groupedActivities = groupActivitiesByDate(activities);
  const dateKeys = Object.keys(groupedActivities);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Activity</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Track all interactions with your leads</p>
        </div>

        <div className="mb-6 flex gap-3">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
          <button className="px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center gap-2 bg-white dark:bg-gray-950">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="max-w-4xl">
          {dateKeys.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No activities found</p>
            </div>
          ) : (
            dateKeys.map((dateKey) => (
              <div key={dateKey} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gray-200"></div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {dateKey}
                  </h3>
                  <div className="h-px flex-1 bg-gray-200"></div>
                </div>

                <div className="space-y-3">
                  {groupedActivities[dateKey].map((activity) => {
                    const config = getActivityConfig(activity.type);

                    return (
                      <div
                        key={activity.id}
                        onClick={() => onLeadClick(activity.leadId)}
                        className="bg-white dark:bg-gray-950 rounded-xl p-5 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                            {config.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-bold ${config.color} uppercase tracking-wide`}>
                                    {config.label}
                                  </span>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">{activity.date}</span>
                                </div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                  {activity.leadName}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                  {activity.content}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                {activity.stage}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Deal: <span className="font-semibold text-gray-900 dark:text-white">{activity.dealValue}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
