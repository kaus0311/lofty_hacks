import { useCallback, useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ImprovedActionCard, type ActionData } from './components/ImprovedActionCard';
import {
  ImprovedDetailPanel,
  type LeadDetail,
} from './components/ImprovedDetailPanel';
import { LeadsView } from './components/LeadsView';
import { DraggablePipelineView } from './components/DraggablePipelineView';
import { ActivityView } from './components/ActivityView';
import { SmartPlanView } from './components/SmartPlanView';
import { ExplainabilityDrawer } from './components/ExplainabilityDrawer';
import { DraftModal } from './components/DraftModal';
import { toast, Toaster } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

type BackendLead = {
  id: string;
  name: string;
  type: 'buyer' | 'seller';
  budget: number;
  stage: 'new' | 'qualified' | 'showing' | 'negotiation' | 'under_contract' | 'closed';
  lastTouchDays: number;
  lastTouchChannel: 'email' | 'sms' | 'call';
  emailOpened: boolean;
  replied: boolean;
  engagementScore: number;
  email?: string | null;
  phone?: string | null;
  notes: string[];
  listing?: {
    address: string;
    daysOnMarket: number;
    priceReductionDiscussed: boolean;
  } | null;
  healthScore: number;
  dealHealth: 'green' | 'yellow' | 'red';
  healthReasons: string[];
};

type BackendAction = {
  id: string;
  leadId: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  health: 'green' | 'yellow' | 'red';
  reason: string;
  createdAt: string;
  suggestedChannel: 'email' | 'sms' | 'call';
  recommendedTone: 'friendly' | 'formal';
  completed: boolean;
  approved: boolean;
  sent: boolean;
  sentAt?: string | null;
  sentTo?: string | null;
  subject?: string | null;
  draft?: Record<string, any> | null;
  draftUpdatedAt?: string | null;
  lead: BackendLead;
  healthScore: number;
  healthReasons: string[];
};

type BackendActivity = {
  id: string;
  timestamp: string;
  type: string;
  entityType: string;
  entityId: string;
  title: string;
  details: Record<string, any>;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      message = err.detail || message;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return res.json();
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function makeSubject(lead: BackendLead): string {
  if (lead.type === 'seller') {
    const listingName = lead.listing?.address ?? 'your listing';
    return `Quick update on ${listingName}`;
  }
  return 'Quick follow-up on your search';
}

function uiStage(stage: BackendLead['stage']): string {
  const map: Record<BackendLead['stage'], string> = {
    new: 'Initial Contact',
    qualified: 'Initial Contact',
    showing: 'Showing Scheduled',
    negotiation: 'Offer Pending',
    under_contract: 'Under Contract',
    closed: 'Past Client',
  };
  return map[stage];
}

function uiLeadType(type: BackendLead['type']): string {
  return type === 'seller' ? 'Seller' : 'Buyer';
}

function formatDraftText(draft: Record<string, any> | null | undefined): string {
  if (!draft) return '';

  if (draft.type === 'email') {
    return `Subject: ${draft.subject ?? ''}\n\n${draft.body ?? ''}`.trim();
  }

  if (draft.type === 'sms') {
    return (draft.message ?? '').trim();
  }

  if (draft.type === 'call') {
    const parts: string[] = [];
    if (draft.opening) parts.push(`Opening: ${draft.opening}`);
    if (Array.isArray(draft.talkTrack) && draft.talkTrack.length) {
      parts.push('Talk track:');
      draft.talkTrack.forEach((item: string) => parts.push(`- ${item}`));
    }
    if (Array.isArray(draft.questions) && draft.questions.length) {
      parts.push('Questions:');
      draft.questions.forEach((item: string) => parts.push(`- ${item}`));
    }
    if (draft.close) parts.push(`Close: ${draft.close}`);
    if (draft.voicemail) parts.push(`Voicemail: ${draft.voicemail}`);
    return parts.join('\n');
  }

  return JSON.stringify(draft, null, 2);
}

function inferDraftType(text: string): 'email' | 'sms' {
  const trimmed = text.trim();
  if (!trimmed) return 'email';
  if (/^subject:/i.test(trimmed)) return 'email';
  if (trimmed.includes('\n')) return 'email';
  return trimmed.length > 180 ? 'email' : 'sms';
}

function parseDraftText(text: string, fallbackSubject: string, preferredType: 'email' | 'sms') {
  const trimmed = text.trim();

  const subjectMatch = trimmed.match(/^Subject:\s*(.*?)(?:\r?\n){2}([\s\S]*)$/i);
  if (subjectMatch) {
    return {
      type: 'email' as const,
      subject: subjectMatch[1].trim() || fallbackSubject,
      body: subjectMatch[2].trim(),
    };
  }

  if (preferredType === 'sms') {
    return {
      type: 'sms' as const,
      message: trimmed,
    };
  }

  return {
    type: 'email' as const,
    subject: fallbackSubject,
    body: trimmed,
  };
}

function buildTimeline(lead: BackendLead, activities: BackendActivity[]): LeadDetail['timeline'] {
  const related: LeadDetail['timeline'] = activities
    .filter((event) => event.entityId === lead.id || event.details?.leadId === lead.id)
    .slice(0, 5)
    .map((event) => ({
      type:
        event.type === 'sent' || event.type === 'draft_created' || event.type === 'draft_updated'
          ? ('email' as const)
          : ('note' as const),
      content: event.title,
      date: new Date(event.timestamp).toLocaleDateString(),
    }));

  const fallback: LeadDetail['timeline'][number] = {
    type: 'note',
    content: `Last touch was ${lead.lastTouchDays} days ago via ${lead.lastTouchChannel}`,
    date: `${lead.lastTouchDays}d ago`,
  };

  return [fallback, ...related];
}

function buildLeadDetail(
  lead: BackendLead,
  activities: BackendActivity[],
  relatedAction?: BackendAction | null
): LeadDetail {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email ?? '',
    phone: lead.phone ?? '',
    dealValue: formatMoney(lead.budget),
    budget: formatMoney(lead.budget),
    stage: uiStage(lead.stage),
    leadType: uiLeadType(lead.type),
    listingAddress: lead.listing?.address,
    propertyType: lead.type === 'seller' ? 'Seller Listing' : 'Buyer Search',
    bedrooms: undefined,
    bathrooms: undefined,
    notes: lead.notes.join(' • '),
    timeline: buildTimeline(lead, activities),
    whyRecommended:
      relatedAction?.reason ||
      lead.healthReasons.join('. ') ||
      'Recent engagement suggests a normal follow-up.',
    aiDraft: formatDraftText(relatedAction?.draft),
  };
}

function buildActionCard(action: BackendAction): ActionData {
  return {
    id: action.id,
    priority: action.priority === 'high' ? 1 : action.priority === 'medium' ? 2 : 3,
    health: action.health,
    leadName: action.lead.name,
    actionTitle: action.title,
    reason: action.reason,
    lastTouchDays: action.lead.lastTouchDays,
    stage: uiStage(action.lead.stage),
  };
}

function buildWhyText(why: any): string {
  const lines: string[] = [];
  if (why?.summary) lines.push(why.summary);

  if (why?.score !== undefined || why?.health) {
    lines.push(`Score: ${why.score ?? 'n/a'} (${why.health ?? 'n/a'})`);
  }

  if (Array.isArray(why?.factors) && why.factors.length) {
    lines.push('');
    lines.push('Key factors:');
    why.factors.forEach((factor: any) => {
      lines.push(`- ${factor.label}: ${factor.evidence}`);
    });
  }

  if (Array.isArray(why?.risks) && why.risks.length) {
    lines.push('');
    lines.push('Risks:');
    why.risks.forEach((risk: string) => lines.push(`- ${risk}`));
  }

  if (Array.isArray(why?.recommended_next_steps) && why.recommended_next_steps.length) {
    lines.push('');
    lines.push('Next steps:');
    why.recommended_next_steps.forEach((step: string) => lines.push(`- ${step}`));
  }

  return lines.join('\n');
}

export default function App() {
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');

  const [leads, setLeads] = useState<BackendLead[]>([]);
  const [actions, setActions] = useState<BackendAction[]>([]);
  const [activities, setActivities] = useState<BackendActivity[]>([]);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

  const [isExplainabilityOpen, setIsExplainabilityOpen] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [draftText, setDraftText] = useState('');

  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [leadsRes, actionsRes, activitiesRes] = await Promise.all([
      request<{ leads: BackendLead[] }>('/api/leads'),
      request<{ actions: BackendAction[] }>('/api/actions'),
      request<{ activities: BackendActivity[] }>('/api/activities'),
    ]);

    setLeads(leadsRes.leads);
    setActions(actionsRes.actions);
    setActivities(activitiesRes.activities);

    setSelectedActionId((prev) => prev ?? actionsRes.actions[0]?.id ?? null);
    setSelectedLeadId((prev) => prev ?? actionsRes.actions[0]?.leadId ?? leadsRes.leads[0]?.id ?? null);
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        await loadData();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load app data';
        toast.error(message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [loadData]);

  const selectedAction = useMemo(
    () => actions.find((action) => action.id === selectedActionId) ?? null,
    [actions, selectedActionId]
  );

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );

  const selectedUiLead = useMemo(() => {
    if (!selectedLead) return null;
    const relatedAction = actions.find((action) => action.leadId === selectedLead.id) ?? null;
    return buildLeadDetail(selectedLead, activities, relatedAction);
  }, [selectedLead, actions, activities]);

  const uiLeads: LeadDetail[] = useMemo(() => {
    return leads.map((lead) => {
      const matchingAction = actions.find((action) => action.leadId === lead.id) ?? null;
      return buildLeadDetail(lead, activities, matchingAction);
    });
  }, [leads, actions, activities]);

  const uiActions: ActionData[] = useMemo(() => {
    return actions.map(buildActionCard);
  }, [actions]);

  const openActionsCount = actions.filter((action) => !action.completed && !action.sent).length;
  const redDealsCount = leads.filter((lead) => lead.dealHealth === 'red').length;
  const draftsReadyCount = actions.filter((action) => !!action.draft).length;

  const currentDraft = selectedAction?.draft ? formatDraftText(selectedAction.draft) : draftText;
  const leadForModal = selectedUiLead;

  const handleLeadClick = (leadId: string) => {
    setSelectedLeadId(leadId);
    const matchingAction = actions.find((action) => action.leadId === leadId);
    if (matchingAction) {
      setSelectedActionId(matchingAction.id);
    }
  };

  const handleActionClick = (actionId: string) => {
    setSelectedActionId(actionId);
    const action = actions.find((action) => action.id === actionId);
    if (action) {
      setSelectedLeadId(action.leadId);
    }
  };

  const handleGenerateDraft = async () => {
    if (!selectedAction) {
      toast.error('Select an action first');
      return;
    }

    try {
      const result = await request<{
        actionId: string;
        subject: string;
        draft: Record<string, any>;
        draftText: string;
        source: string;
      }>(`/api/actions/${selectedAction.id}/draft`, {
        method: 'POST',
        body: JSON.stringify({
          tone: selectedAction.recommendedTone,
          channel: selectedAction.suggestedChannel,
          goal: 're-engage the lead and move the deal forward',
        }),
      });

      setDraftText(result.draftText);
      await loadData();
      toast.success('Draft generated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate draft';
      toast.error(message);
    }
  };

  const handleExplainWhy = async () => {
    if (!selectedAction) {
      toast.error('Select an action first');
      return;
    }

    try {
      const result = await request<{ why: any }>(`/api/actions/${selectedAction.id}/why`, {
        method: 'POST',
      });
      setExplanation(buildWhyText(result.why));
      setIsExplainabilityOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to explain action';
      toast.error(message);
    }
  };

  const handleOpenDraftModal = () => {
    if (!selectedAction) {
      toast.error('Select an action first');
      return;
    }
    setDraftText(currentDraft);
    setIsDraftModalOpen(true);
  };

  const handleApprove = async (draft: string) => {
    if (!selectedAction) {
      toast.error('Select an action first');
      return;
    }

    try {
      const preferredType =
        selectedAction.draft?.type === 'sms' || selectedAction.suggestedChannel === 'sms'
          ? 'sms'
          : 'email';

      const parsed = parseDraftText(draft, makeSubject(selectedAction.lead), preferredType);

      await request(`/api/actions/${selectedAction.id}/draft`, {
        method: 'PUT',
        body: JSON.stringify({
          subject: parsed.type === 'email' ? parsed.subject : '',
          draft: parsed,
        }),
      });

      await request(`/api/actions/${selectedAction.id}/approve`, {
        method: 'POST',
      });

      await request(`/api/actions/${selectedAction.id}/send`, {
        method: 'POST',
      });

      await loadData();
      toast.success('Message sent successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve and send';
      toast.error(message);
    }
  };

  const handleSimulate = (_draft: string) => {
    toast.info('Simulated send complete', {
      description: 'No actual email was sent. Review the preview.',
    });
  };

  const handleMarkComplete = async () => {
    if (!selectedAction) return;

    try {
      await request(`/api/actions/${selectedAction.id}/complete`, {
        method: 'POST',
      });
      await loadData();
      toast.success('Action marked as complete');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark complete';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-black text-gray-600 dark:text-gray-300">
        Loading...
      </div>
    );
  }

  return (
    <>
      <div className="h-screen w-screen flex bg-gray-50 dark:bg-black">
        <Sidebar activeItem={activeMenuItem} onItemClick={setActiveMenuItem} />

        <div className="flex-1 flex flex-col overflow-hidden dark:bg-black">
          <TopBar
            openActions={openActionsCount}
            redDeals={redDealsCount}
            draftsReady={draftsReadyCount}
          />

          <div className="flex-1 flex overflow-hidden">
            {activeMenuItem === 'dashboard' ? (
              <>
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Dashboard
                      </h2>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          <span className="font-semibold text-red-600">
                            {openActionsCount} open actions
                          </span>
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          <span className="font-semibold text-red-600">
                            {redDealsCount} red deals
                          </span>
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          <span className="font-semibold text-blue-600">
                            {draftsReadyCount} drafts ready
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="max-w-5xl space-y-3">
                      {uiActions.map((action) => (
                        <ImprovedActionCard
                          key={action.id}
                          action={action}
                          isSelected={selectedActionId === action.id}
                          onClick={() => handleActionClick(action.id)}
                          onWhyClick={() => {
                            handleActionClick(action.id);
                            handleExplainWhy();
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <ImprovedDetailPanel
                  lead={selectedUiLead}
                  onGenerateDraft={handleGenerateDraft}
                  onExplainWhy={handleExplainWhy}
                  onOpenDraftModal={handleOpenDraftModal}
                  onSimulateSend={() => handleSimulate(currentDraft)}
                  onMarkComplete={handleMarkComplete}
                />
              </>
            ) : activeMenuItem === 'leads' ? (
              <>
                <LeadsView
                  leads={uiLeads}
                  onLeadClick={handleLeadClick}
                  selectedLeadId={selectedLeadId}
                />

                <ImprovedDetailPanel
                  lead={selectedUiLead}
                  onGenerateDraft={handleGenerateDraft}
                  onExplainWhy={handleExplainWhy}
                  onOpenDraftModal={handleOpenDraftModal}
                  onSimulateSend={() => handleSimulate(currentDraft)}
                  onMarkComplete={handleMarkComplete}
                />
              </>
            ) : activeMenuItem === 'pipeline' ? (
              <DraggablePipelineView
                leads={uiLeads}
                onLeadClick={handleLeadClick}
                selectedLeadId={selectedLeadId}
              />
            ) : activeMenuItem === 'activity' ? (
              <ActivityView leads={uiLeads} onLeadClick={handleLeadClick} />
            ) : activeMenuItem === 'smart-plan' ? (
              <SmartPlanView leads={uiLeads} onLeadClick={handleLeadClick} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>View under construction</p>
              </div>
            )}
          </div>
        </div>

        <ExplainabilityDrawer
          isOpen={isExplainabilityOpen}
          onClose={() => setIsExplainabilityOpen(false)}
          explanation={explanation}
          leadName={selectedLead?.name || ''}
        />

        <DraftModal
          isOpen={isDraftModalOpen}
          onClose={() => setIsDraftModalOpen(false)}
          leadName={selectedLead?.name || ''}
          initialDraft={currentDraft}
          onApprove={handleApprove}
          onSimulate={handleSimulate}
        />
      </div>

      <Toaster position="top-right" richColors />
    </>
  );
}