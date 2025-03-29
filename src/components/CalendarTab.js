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

  useEffect(() => {
    localStorage.setItem('calendarIncludePending', includePending);
  }, [includePending]);
  useEffect(() => {
    localStorage.setItem('calendarViewMode', viewMode);
  }, [viewMode]);

  // Global click listener to close detail modal when clicking outside modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ date: null, events: [] });
  useEffect(() => {
    const handleDocumentClick = (e) => {
      // Ignore clicks inside modal container
      if (e.target.closest('.modal-content')) return;
      setModalOpen(false);
    };
    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, []);

  // Filter events based on includePending state
  const filteredEvents = events.filter(e =>
    includePending ? (e.status === 'upcoming' || e.status === 'maybe') : (e.status === 'upcoming')
  );

  // State for the currently displayed date and calendar grid calculation
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper: Format Date as YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split('T')[0];

  // Navigation handlers
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

  // When a day cell is clicked, open a modal with detailed info.
  const openModalForDate = (date, eventsForDay) => {
    setModalContent({ date, events: eventsForDay });
    setModalOpen(true);
  };

  // Calculate calendar grid
  let weeks = [];
  if (viewMode === "monthly") {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  } else {
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

  // Get today's date for highlighting
  const todayStr = formatDate(new Date());

  return (
    <div className="p-4 relative">
      <h2 className="text-2xl font-bold mb-4">Calendar</h2>
      
      {/* Include Pending + View Mode Selector */}
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
          <div className="flex items-center cursor-pointer" onClick={() => setViewMode("monthly")}>
            <div className={`w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center ${viewMode === "monthly" ? "bg-blue-500" : "bg-white"}`}>
              {viewMode === "monthly" && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
            <span className="ml-2 text-sm">Monthly</span>
          </div>
          <div className="flex items-center cursor-pointer" onClick={() => setViewMode("weekly")}>
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
                  <td 
                    key={di} 
                    className={`border p-2 h-24 relative transition-colors rounded-md hover:bg-gray-50 ${dateStr === todayStr ? 'bg-blue-100' : ''}`}
                    onClick={() => {}}
                  >
                    <div className="font-bold text-sm">{day.getDate()}</div>
                    <div className="mt-1 space-y-1">
                      {eventsForDay.slice(0, 2).map((event, i) => (
                        <div 
                          key={i} 
                          className="bg-blue-500 text-white text-xs font-semibold px-1 py-0.5 rounded overflow-hidden whitespace-nowrap truncate"
                        >
                          {event.eventName || 'Unnamed'}
                        </div>
                      ))}
                      {eventsForDay.length > 2 && (
                        <div className="text-xs text-gray-500">+{eventsForDay.length - 2} more</div>
                      )}
                    </div>
                    {/* Info Icon */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); openModalForDate(day, eventsForDay); }}
                      className="absolute top-1 right-1 p-2 text-blue-500 hover:text-blue-700 transition-transform duration-150"
                      title="More info"
                    >
                      i
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Overlay for Detailed Info */}
      {modalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"
          onClick={() => setModalOpen(false)}
        >
          <div 
            className="modal-content bg-white rounded-md p-4 w-11/12 max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setModalOpen(false)}
              title="Close"
            >
              &times;
            </button>
            <h4 className="text-lg font-bold mb-2">{modalContent.date && modalContent.date.toDateString()}</h4>
            {modalContent.events.length === 0 ? (
              <p className="text-sm">No events for this day.</p>
            ) : (
              <ul className="space-y-1">
                {modalContent.events.map((event, idx) => (
                  <li key={idx} className="text-sm border-b pb-1">
                    <span className="font-semibold">{event.eventName || 'Unnamed Event'}</span>
                    {event.clientName && (
                      <span className="italic text-xs text-gray-600"> - {event.clientName}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarTab;
