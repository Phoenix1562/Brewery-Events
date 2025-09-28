// components/UpcomingTab.js
import React, { useMemo, useState } from 'react';
import EventPreviewCard from './EventPreviewCard';
import TabHeader from './TabHeader';
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
    <div className="p-5 bg-surface-900 border border-surface-700 rounded-2xl shadow-lg text-surface-50">
      <TabHeader
        icon={(
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-800 text-accent-300">
            <CalendarClock className="h-6 w-6" />
          </span>
        )}
        title="Upcoming Events"
        titleClassName="text-surface-50"
      />

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-surface-300" />
        <input
          type="text"
          placeholder="Search events, people..."
          className="w-full p-2 pl-10 rounded-lg border border-surface-600 bg-surface-800 text-surface-50 placeholder-surface-200/70 transition-colors focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-surface-900"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-surface-400 transition-colors hover:text-accent-200"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {(events || []).length > 0 && (
        <div className="mb-4 flex flex-col gap-3 text-sm sm:flex-row">
          <div className="flex-1 rounded-xl border border-accent-500/40 bg-surface-800/80 p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500/15 text-accent-200">
                <CheckCircle className="h-4 w-4" />
              </span>
              <span className="font-medium text-surface-50">{(events || []).length} upcoming {(events || []).length === 1 ? 'event' : 'events'}</span>
            </div>
          </div>

          {/* Adjusted to use firstEventTitle which checks for eventName first */}
          {firstEventDate && sortedEvents.length > 0 && (
            <div className="flex-1 rounded-xl border border-accent-500/40 bg-surface-800/80 p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500/15 text-accent-200">
                  <AlertCircle className="h-4 w-4" />
                </span>
                <span className="font-medium text-accent-200 truncate">
                  {nextEventCountdown}: {firstEventTitle}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="text-center py-6 rounded-xl border border-surface-600 bg-surface-800/80">
          <CalendarClock className="h-8 w-8 text-accent-200 mx-auto mb-2" />
          <p className="text-surface-200">
            {searchTerm ? "No events match your search." : "No upcoming events"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
            <div key={monthYear}>
              <h3 className="mb-2 border-b border-surface-700 pb-1 text-sm font-medium text-surface-150">
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