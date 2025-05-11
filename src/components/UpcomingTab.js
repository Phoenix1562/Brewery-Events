// components/UpcomingTab.js
import React, { useMemo, useState } from 'react';
import EventPreviewCard from './EventPreviewCard';
import { CalendarClock, CheckCircle, AlertCircle, Search, X } from 'lucide-react';

function UpcomingTab({ events, onSelectEvent }) {
  const [searchTerm, setSearchTerm] = useState('');

  const sortedEvents = useMemo(
    () => [...(events || [])].sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate)),
    [events]
  );

  // Filter events based on search term
  const filteredEvents = useMemo(() => {
    if (!searchTerm.trim()) {
      return sortedEvents;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase().trim();

    return sortedEvents.filter(event => {
      // **IMPORTANT: Using event.eventName, assuming this is the correct field name like in FinishedTab.js**
      const eventName = String(event.eventName || '').toLowerCase(); // Changed from event.title

      // Using the more robust guard for description from your FinishedTab.js example
      const description = (event.description && typeof event.description === "string"
                          ? event.description.toLowerCase()
                          : "");

      const clientName = String(event.clientName || '').toLowerCase();

      return eventName.includes(lowercasedSearchTerm) ||
             description.includes(lowercasedSearchTerm) ||
             clientName.includes(lowercasedSearchTerm);
    });
  }, [sortedEvents, searchTerm]);

  // This part of your original code uses sortedEvents[0].title for the summary.
  // If the actual data uses eventName, this might also need adjustment
  // For now, I'm leaving it as is, as the primary issue is search filtering.
  const firstEventDate = sortedEvents.length > 0 ? sortedEvents[0].eventDate : null;
  const firstEventTitle = sortedEvents.length > 0 ? (sortedEvents[0].eventName || sortedEvents[0].title || "Upcoming Event") : "Upcoming Event";


  const groupedEvents = useMemo(() => {
    const groups = {};
    filteredEvents.forEach((event) => {
      const [year, month, day] = event.eventDate.split('T')[0].split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      const monthYear = `${date.toLocaleString('default', { month: 'long', timeZone: 'UTC' })} ${date.getUTCFullYear()}`;
      
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(event);
    });
    return groups;
  }, [filteredEvents]);

  const nextEventCountdown = useMemo(() => {
    if (!firstEventDate) return null;

    const [year, month, day] = firstEventDate.split('T')[0].split('-').map(Number);
    const today = new Date();
    const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const eventUTC = Date.UTC(year, month - 1, day);
    const diffDays = Math.ceil((eventUTC - todayUTC) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Event has passed";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    return `In ${Math.ceil(diffDays / 30.44)} months`;
  }, [firstEventDate]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center mb-4">
        <CalendarClock className="h-5 w-5 text-[#FF5A5F] mr-2" />
        <h2 className="text-xl font-bold text-gray-800">Upcoming Events</h2>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search events, people..."
          className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-1 focus:ring-[#FF5A5F] focus:border-[#FF5A5F]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {(events || []).length > 0 && (
        <div className="mb-4 flex gap-3 text-sm">
          <div className="flex-1 bg-[#FFF5F7] p-3 rounded-lg border-l-[3px] border-[#FF5A5F]">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-[#FF5A5F] mr-1" />
              <span className="font-medium">{(events || []).length} upcoming {(events || []).length === 1 ? 'event' : 'events'}</span>
            </div>
          </div>
          
          {/* Adjusted to use firstEventTitle which checks for eventName first */}
          {firstEventDate && sortedEvents.length > 0 && (
            <div className="flex-1 bg-[#FFF5F7] p-3 rounded-lg border-l-[3px] border-[#FF5A5F]">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-[#FF5A5F] mr-1" />
                <span className="font-medium text-[#FF5A5F] truncate">
                  {nextEventCountdown}: {firstEventTitle}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <CalendarClock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">
            {searchTerm ? "No events match your search." : "No upcoming events"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
            <div key={monthYear}>
              <h3 className="text-sm font-medium text-gray-700 mb-2 pb-1 border-b">
                {monthYear}
              </h3>
              <div className="space-y-2">
                {monthEvents.map(event => (
                  <EventPreviewCard
                    key={event.id}
                    event={event} // EventPreviewCard will need to know if it's event.title or event.eventName
                    onClick={() => onSelectEvent(event)}
                    highlight={firstEventDate && event.eventDate === firstEventDate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UpcomingTab;