import { Clock, Calendar, CheckSquare, BarChart2, HelpCircle } from 'lucide-react';

function Sidebar({ currentTab, setCurrentTab, onExport }) {
  const tabs = [
    { id: 'maybe', label: 'Pending', icon: HelpCircle },
    { id: 'upcoming', label: 'Upcoming', icon: Clock },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'finished', label: 'Finished', icon: CheckSquare },
    { id: 'statistics', label: 'Statistics', icon: BarChart2 }
  ];

  return (
    <div className="w-64 bg-gray-900 text-white h-full flex flex-col shadow-lg">
      {/* Header with minimal design */}
      <div className="pt-8 pb-6 px-4">
        <h2 className="text-2xl font-semibold text-center tracking-wide">EVENT PLANNER</h2>
        <div className="h-0.5 w-16 bg-blue-500 mx-auto mt-3"></div>
      </div>

      {/* Tab list with proper icons */}
      <div className="flex-1 flex flex-col px-3 py-4 space-y-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`
                flex items-center px-4 py-3 rounded-md transition-all duration-200
                ${currentTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }
              `}
            >
              <Icon className={`h-5 w-5 mr-3 ${currentTab === tab.id ? 'text-white' : 'text-gray-500'}`} />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Export button with clean design */}
      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={onExport}
          className="w-full px-4 py-3 bg-yellow-500 text-white rounded-md font-medium hover:bg-yellow-600 transition-all flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Export to Excel
        </button>
      </div>
    </div>
  );
}

export default Sidebar;