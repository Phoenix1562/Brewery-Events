import React, { useState, useEffect } from 'react';

function CalendarTab({ events }) {
  // Persisted state with localStorage
  const [includePending, setIncludePending] = useState(() => {
    const stored = localStorage.getItem('calendarIncludePending');
    return stored ? stored === 'true' : false;
  });
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('calendarViewMode') || 'monthly';
  });

  // Update localStorage when state changes
  useEffect(() => {
    localStorage.setItem('calendarIncludePending', includePending);
  }, [includePending]);

  useEffect(() => {
    localStorage.setItem('calendarViewMode', viewMode);
  }, [viewMode]);

  // Global document click listener to close popups when clicking anywhere else
  useEffect(() => {
    const handleDocumentClick = () => {
      setOpenInfo({});
    };
    document.addEventListener('click', handleDocumentClick, true); // use capture phase
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, []);

  // Filter events based on includePending state
  const filteredEvents = events.filter(e =>
    includePending ? (e.status === 'upcoming' || e.status === 'maybe') : (e.status === 'upcoming')
  );

  // State for the currently displayed date and open info popups
  const [currentDate, setCurrentDate] = useState(new Date());
  // openInfo: an object keyed by date string; if present and true, popup is open for that cell
  const [openInfo, setOpenInfo] = useState({});

  // Helper: Format Date as YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split('T')[0];

  // Navigation handlers adjust based on view mode
  const handlePrev = () => {
    if (viewMode === "monthly") {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    }
  };

  const handleNext = () => {
    if (viewMode === "monthly") {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    }
  };

  // Toggle detailed info for a given date (stop propagation to prevent global dismiss)
  const toggleInfo = (dateStr, e) => {
    if(e) e.stopPropagation();
    setOpenInfo(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  // Calculate calendar grid based on view mode
  let weeks = [];
  if (viewMode === "monthly") {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay(); // 0=Sun ... 6=Sat

    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    while (days.length % 7 !== 0) {
      days.push(null);
    }
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
  } else {
    // Weekly view: calculate week starting on Sunday
    const current = new Date(currentDate);
    const dayOfWeek = current.getDay();
    const weekStart = new Date(current);
    weekStart.setDate(current.getDate() - dayOfWeek);
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      weekDays.push(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
    }
    weeks.push(weekDays);
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Calendar</h2>
      
      {/* Row: Include Pending + View Mode Selector */}
      <div className="flex items-center mb-4">
        <div className="flex items-center">
          <input 
            type="checkbox"
            id="includePending"
            checked={includePending}
            onChange={(e) => setIncludePending(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="includePending" className="text-sm">Include Pending Events</label>
        </div>
        <div className="flex items-center ml-auto space-x-6">
          <div className="flex items-center cursor-pointer" onClick={(e) => toggleInfo('dummy', e) /* prevent global dismiss if needed */ || setViewMode("monthly")}>
            <div className={`w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center ${viewMode === "monthly" ? "bg-blue-500" : "bg-white"}`}>
              {viewMode === "monthly" && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <span className="ml-2 text-sm">Monthly</span>
          </div>
          <div className="flex items-center cursor-pointer" onClick={(e) => toggleInfo('dummy', e) || setViewMode("weekly")}>
            <div className={`w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center ${viewMode === "weekly" ? "bg-blue-500" : "bg-white"}`}>
              {viewMode === "weekly" && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <span className="ml-2 text-sm">Weekly</span>
          </div>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrev} className="px-4 py-2 bg-blue-500 text-white rounded">Previous</button>
        <h3 className="text-xl">
          {viewMode === "monthly"
            ? `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`
            : `Week of ${new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay()).toLocaleDateString()}`
          }
        </h3>
        <button onClick={handleNext} className="px-4 py-2 bg-blue-500 text-white rounded">Next</button>
      </div>
      
      {/* Calendar Grid */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <th key={index} className="border p-2">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) => {
                if (!day) return <td key={di} className="border p-2 h-24"></td>;
                const dateStr = formatDate(day);
                const eventsForDay = filteredEvents.filter(e => e.eventDate === dateStr);
                return (
                  <td key={di} className="border p-2 align-top h-24 relative" onClick={() => setOpenInfo({})}>
                    <div className="font-bold">{day.getDate()}</div>
                    {/* Display only event name(s) in the cell */}
                    {eventsForDay.slice(0, 2).map((event, i) => (
                      <div key={i} className="text-sm truncate">
                        {event.eventName || 'Unnamed Event'}
                      </div>
                    ))}
                    {eventsForDay.length > 2 && (
                      <div className="text-xs text-gray-500">+{eventsForDay.length - 2} more</div>
                    )}
                    {/* Enlarged "i" icon with extra padding */}
                    <button 
                      onClick={(e) => toggleInfo(dateStr, e)}
                      className="absolute top-1 right-1 p-2 text-blue-500 hover:text-blue-700"
                      title="More info"
                    >
                      i
                    </button>
                    {/* Detail Popup */}
                    {openInfo[dateStr] && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bg-white text-black border p-2 mt-2 left-0 z-10 shadow-lg"
                      >
                        <h4 className="font-bold mb-1">{day.toDateString()}</h4>
                        {eventsForDay.length === 0 ? (
                          <p className="text-sm">No events.</p>
                        ) : (
                          <ul className="text-sm">
                            {eventsForDay.map((event, idx) => (
                              <li key={idx}>
                                {event.clientName ? `${event.clientName} - ` : ''}{event.eventName || 'Unnamed Event'}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CalendarTab;
