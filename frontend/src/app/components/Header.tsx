interface HeaderProps {
  openActions: number;
  redDeals: number;
  draftsReady: number;
}

export function Header({ openActions, redDeals, draftsReady }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Today's Highest-Leverage Actions</h2>
          <p className="text-sm text-gray-500 mt-1">Focus on what matters most</p>
        </div>

        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900">{openActions}</div>
            <div className="text-xs text-gray-500 mt-1">Open Actions</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="text-center">
            <div className="text-2xl font-semibold text-red-600">{redDeals}</div>
            <div className="text-xs text-gray-500 mt-1">Red Deals</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600">{draftsReady}</div>
            <div className="text-xs text-gray-500 mt-1">Drafts Ready</div>
          </div>
        </div>
      </div>
    </div>
  );
}
