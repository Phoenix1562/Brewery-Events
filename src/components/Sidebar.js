function Sidebar({ currentTab, setCurrentTab, onExport }) {
  const tabs = [
    { id: 'maybe', label: 'Pending' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'finished', label: 'Finished' },
    { id: 'statistics', label: 'Statistics' }
  ];

  return (
    <div className="w-64 bg-gray-800 text-white h-full p-4 flex flex-col">
      {/* Header stays at the top */}
      <h2 className="text-3xl font-bold mt-6 mb-8 text-center">Event Planner</h2>

      {/* Tab list */}
      <div className="flex-1 flex flex-col justify-center">
        <ul className="space-y-4">
          {tabs.map(tab => (
            <li 
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`cursor-pointer text-center p-4 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                currentTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Export button at the bottom */}
      <div className="mt-auto">
        <button 
          onClick={onExport}
          className="w-full px-3 py-2 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition"
          title="Export events to Excel"
        >
          Export to Excel
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
