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
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-gray-50 p-6 shadow-sm">
      <TabHeader
        icon={<CalendarClock className="h-7 w-7 text-[#FF5A5F]" />}
        title="Upcoming Events"
      />

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
        <input
          type="text"
          placeholder="Search events, people..."
          className="w-full rounded-full border border-gray-200 bg-white/80 py-2.5 pl-12 pr-12 text-sm shadow-inner focus:border-[#FF5A5F] focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]/30"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 transform text-gray-400 transition hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {(events || []).length > 0 && (
        <div className="mb-6 grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-[#FF5A5F]/20 bg-[#FFF5F7] px-4 py-3 shadow-inner">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF5A5F]/10">
              <CheckCircle className="h-5 w-5 text-[#FF5A5F]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#FF5A5F]">Pipeline</p>
              <p className="font-semibold text-gray-700">{(events || []).length} upcoming {(events || []).length === 1 ? 'event' : 'events'}</p>
            </div>
          </div>

          {/* Adjusted to use firstEventTitle which checks for eventName first */}
          {firstEventDate && sortedEvents.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-[#FF5A5F]/20 bg-[#FFF5F7] px-4 py-3 shadow-inner">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF5A5F]/10">
                <AlertCircle className="h-5 w-5 text-[#FF5A5F]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-[#FF5A5F]">Next up</p>
                <p className="font-semibold text-[#FF5A5F] truncate">
                  {nextEventCountdown}: {firstEventTitle}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 py-12 text-center">
          <CalendarClock className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">{searchTerm ? "No events match your search." : "No upcoming events"}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
            <div key={monthYear}>
              <h3 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A5F]" />
                {monthYear}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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