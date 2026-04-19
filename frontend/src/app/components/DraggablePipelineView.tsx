import { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DollarSign, Phone, Mail, Clock } from 'lucide-react';
import { LeadDetail } from './ImprovedDetailPanel';

interface DraggablePipelineViewProps {
  leads: LeadDetail[];
  onLeadClick: (leadId: string) => void;
  selectedLeadId: string | null;
}

const ItemType = 'LEAD_CARD';

const pipelineStages = [
  { id: 'initial-contact', label: 'Initial Contact', color: 'bg-slate-100', darkColor: 'bg-slate-200' },
  { id: 'showing-scheduled', label: 'Showing Scheduled', color: 'bg-blue-100', darkColor: 'bg-blue-200' },
  { id: 'active-search', label: 'Active Search', color: 'bg-purple-100', darkColor: 'bg-purple-200' },
  { id: 'offer-pending', label: 'Offer Pending', color: 'bg-amber-100', darkColor: 'bg-amber-200' },
  { id: 'under-contract', label: 'Under Contract', color: 'bg-green-100', darkColor: 'bg-green-200' },
  { id: 'past-client', label: 'Past Client', color: 'bg-gray-100', darkColor: 'bg-gray-200' },
];

interface LeadCardProps {
  lead: LeadDetail;
  isSelected: boolean;
  onLeadClick: (leadId: string) => void;
}

function LeadCard({ lead, isSelected, onLeadClick }: LeadCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType,
    item: { leadId: lead.id, currentStage: lead.stage },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const lastActivity = lead.timeline[0]?.date || 'No activity';

  return (
    <div
      ref={drag}
      onClick={() => onLeadClick(lead.id)}
      className={`bg-white dark:bg-gray-950 rounded-lg p-3 mb-2.5 border-2 cursor-move transition-all ${
        isDragging ? 'opacity-50 rotate-2' : ''
      } ${
        isSelected
          ? 'border-blue-500 shadow-md'
          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-white flex-1 pr-2">
          {lead.name}
        </h4>
        <div className="flex gap-1">
          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
            <Phone className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
            <Mail className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      {lead.listingAddress && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 truncate">{lead.listingAddress}</p>
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
          {lead.leadType}
        </span>
        {lead.propertyType && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{lead.propertyType}</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">{lead.dealValue}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{lastActivity}</span>
        </div>
      </div>
    </div>
  );
}

interface PipelineColumnProps {
  stage: typeof pipelineStages[0];
  leads: LeadDetail[];
  onLeadClick: (leadId: string) => void;
  selectedLeadId: string | null;
  onDrop: (leadId: string, newStage: string) => void;
}

function PipelineColumn({ stage, leads, onLeadClick, selectedLeadId, onDrop }: PipelineColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (item: { leadId: string; currentStage: string }) => {
      onDrop(item.leadId, stage.label);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const totalValue = leads.reduce((total, lead) => {
    const value = parseInt(lead.dealValue.replace(/[$,]/g, '')) || 0;
    return total + value;
  }, 0);

  const formatCurrency = (value: number) => {
    if (value === 0) return '$0';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <div
      ref={drop}
      className={`flex-shrink-0 w-72 rounded-lg transition-all ${
        isOver ? stage.darkColor : stage.color
      }`}
    >
      <div className="p-3 border-b-2 border-gray-300">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-sm text-gray-900">{stage.label}</h3>
          <span className="px-2 py-0.5 bg-white rounded-full text-xs font-bold text-gray-700 shadow-sm">
            {leads.length}
          </span>
        </div>
        <div className="text-xs font-semibold text-gray-700">
          {formatCurrency(totalValue)}
        </div>
      </div>

      <div className="p-2.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {leads.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            Drag cards here
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              isSelected={selectedLeadId === lead.id}
              onLeadClick={onLeadClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function DraggablePipelineView({ leads: initialLeads, onLeadClick, selectedLeadId }: DraggablePipelineViewProps) {
  const [leads, setLeads] = useState(initialLeads);

  const normalizeStage = (stage: string): string => {
    return stage.toLowerCase().replace(/\s+/g, '-');
  };

  const handleDrop = (leadId: string, newStage: string) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) =>
        lead.id === leadId ? { ...lead, stage: newStage } : lead
      )
    );
  };

  const getLeadsByStage = (stageId: string) => {
    return leads.filter((lead) => normalizeStage(lead.stage) === stageId);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="p-6 h-full">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pipeline</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Drag and drop leads to update their status</p>
          </div>

          <div className="flex gap-3 pb-4">
            {pipelineStages.map((stage) => {
              const stageLeads = getLeadsByStage(stage.id);
              return (
                <PipelineColumn
                  key={stage.id}
                  stage={stage}
                  leads={stageLeads}
                  onLeadClick={onLeadClick}
                  selectedLeadId={selectedLeadId}
                  onDrop={handleDrop}
                />
              );
            })}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
