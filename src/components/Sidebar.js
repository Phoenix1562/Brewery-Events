import React from 'react';

function Sidebar({ currentTab, setCurrentTab }) {
  return (
    <div className="w-64 bg-gray-800 text-white h-full p-4">
      <h2 className="text-xl font-bold mb-8">Event Planner</h2>
      <ul>
        <li 
          className={`mb-4 cursor-pointer ${currentTab === 'maybe' ? 'text-blue-300' : 'hover:text-blue-500'}`}
          onClick={() => setCurrentTab('maybe')}
        >
          Pending
        </li>
        <li 
          className={`mb-4 cursor-pointer ${currentTab === 'upcoming' ? 'text-blue-300' : 'hover:text-blue-500'}`}
          onClick={() => setCurrentTab('upcoming')}
        >
          Upcoming
        </li>
        <li 
          className={`mb-4 cursor-pointer ${currentTab === 'finished' ? 'text-blue-300' : 'hover:text-blue-500'}`}
          onClick={() => setCurrentTab('finished')}
        >
          Finished
        </li>
        <li 
          className={`mb-4 cursor-pointer ${currentTab === 'statistics' ? 'text-blue-300' : 'hover:text-blue-500'}`}
          onClick={() => setCurrentTab('statistics')}
        >
          Statistics
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
