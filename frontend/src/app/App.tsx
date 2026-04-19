import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ImprovedActionCard } from './components/ImprovedActionCard';
import { ImprovedDetailPanel } from './components/ImprovedDetailPanel';
import { LeadsView } from './components/LeadsView';
import { DraggablePipelineView } from './components/DraggablePipelineView';
import { ActivityView } from './components/ActivityView';
import { SmartPlanView } from './components/SmartPlanView';
import { ExplainabilityDrawer } from './components/ExplainabilityDrawer';
import { DraftModal } from './components/DraftModal';
import { mockActions, mockLeadDetails } from './data/mockData';
import { toast, Toaster } from 'sonner';

export default function App() {
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [selectedActionId, setSelectedActionId] = useState<string | null>(mockActions[0].id);
  const [isExplainabilityOpen, setIsExplainabilityOpen] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

  const selectedLead = selectedActionId ? mockLeadDetails[selectedActionId] : null;
  const highPriorityCount = mockActions.filter(a => a.priority <= 3).length;
  const redDealsCount = mockActions.filter(a => a.health === 'red').length;
  const allLeads = Object.values(mockLeadDetails);

  const handleApprove = (draft: string) => {
    toast.success('Message sent successfully!', {
      description: `Email sent to ${selectedLead?.name}`,
    });
  };

  const handleSimulate = (draft: string) => {
    toast.info('Simulated send complete', {
      description: 'No actual email was sent. Review the preview.',
    });
  };

  const handleMarkComplete = () => {
    toast.success('Action marked as complete', {
      description: 'This action has been moved to your completed list.',
    });
  };

  return (
    <>
      <div className="h-screen w-screen flex bg-gray-50 dark:bg-black">
        <Sidebar activeItem={activeMenuItem} onItemClick={setActiveMenuItem} />

      <div className="flex-1 flex flex-col overflow-hidden dark:bg-black">
        <div className="flex-1 flex overflow-hidden">
          {activeMenuItem === 'dashboard' ? (
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h2>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-red-600">{highPriorityCount} high-priority actions</span>
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        <span className="font-semibold text-red-600">{redDealsCount} red deals</span>
                      </span>
                    </div>
                  </div>

                  <div className="max-w-5xl space-y-3">
                    {mockActions.map((action) => (
                      <ImprovedActionCard
                        key={action.id}
                        action={action}
                        isSelected={selectedActionId === action.id}
                        onClick={() => setSelectedActionId(action.id)}
                        onWhyClick={() => {
                          setSelectedActionId(action.id);
                          setIsExplainabilityOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <ImprovedDetailPanel
                lead={selectedLead}
                onGenerateDraft={() => toast.success('New draft generated')}
                onExplainWhy={() => setIsExplainabilityOpen(true)}
                onOpenDraftModal={() => setIsDraftModalOpen(true)}
                onSimulateSend={() => handleSimulate(selectedLead?.aiDraft || '')}
                onMarkComplete={handleMarkComplete}
              />
            </>
          ) : activeMenuItem === 'leads' ? (
            <>
              <LeadsView
                leads={allLeads}
                onLeadClick={setSelectedActionId}
                selectedLeadId={selectedActionId}
              />

              <ImprovedDetailPanel
                lead={selectedLead}
                onGenerateDraft={() => toast.success('New draft generated')}
                onExplainWhy={() => setIsExplainabilityOpen(true)}
                onOpenDraftModal={() => setIsDraftModalOpen(true)}
                onSimulateSend={() => handleSimulate(selectedLead?.aiDraft || '')}
                onMarkComplete={handleMarkComplete}
              />
            </>
          ) : activeMenuItem === 'pipeline' ? (
            <DraggablePipelineView
              leads={allLeads}
              onLeadClick={setSelectedActionId}
              selectedLeadId={selectedActionId}
            />
          ) : activeMenuItem === 'activity' ? (
            <ActivityView
              leads={allLeads}
              onLeadClick={setSelectedActionId}
            />
          ) : activeMenuItem === 'smart-plan' ? (
            <SmartPlanView
              leads={allLeads}
              onLeadClick={setSelectedActionId}
            />
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
        explanation={selectedLead?.whyRecommended || ''}
        leadName={selectedLead?.name || ''}
      />

      <DraftModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        leadName={selectedLead?.name || ''}
        initialDraft={selectedLead?.aiDraft || ''}
        onApprove={handleApprove}
        onSimulate={handleSimulate}
      />
      </div>
      <Toaster position="top-right" richColors />
    </>
  );
}