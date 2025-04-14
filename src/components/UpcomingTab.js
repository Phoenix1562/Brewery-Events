// components/UpcomingTab.js
import React, { useMemo } from 'react';
import EventPreviewCard from './EventPreviewCard';
import { CalendarClock, CheckCircle, AlertCircle } from 'lucide-react';

function UpcomingTab({ events, onSelectEvent }) {
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate)),
    [events]
  );

  const firstEventDate = sortedEvents.length > 0 ? sortedEvents[0].eventDate : null;

  // Group events by month
  const groupedEvents = useMemo(() => {
    const groups = {};
    sortedEvents.forEach((event) => {
      const [year, month, day] = event.eventDate.split('T')[0].split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      const monthYear = `${date.toLocaleString('default', { month: 'long', timeZone: 'UTC' })} ${date.getUTCFullYear()}`;
      
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(event);
    });
    return groups;
  }, [sortedEvents]);

  // Calculate countdown for first event
  const nextEventCountdown = useMemo(() => {
    if (!firstEventDate) return null;

    const [year, month, day] = firstEventDate.split('T')[0].split('-').map(Number);
    const today = new Date();
    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const eventUTC = Date.UTC(year, month - 1, day);

    const diffDays = Math.ceil((eventUTC - todayUTC) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    return `In ${Math.ceil(diffDays / 30)} months`;
  }, [firstEventDate]);

  // Format date
  const formatEventDate = (dateString) => {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center mb-4">
        <CalendarClock className="h-5 w-5 text-[#FF5A5F] mr-2" />
        <h2 className="text-xl font-bold text-gray-800">Upcoming Events</h2>
      </div>

      {/* Compact summary row */}
      {events.length > 0 && (
        <div className="mb-4 flex gap-3 text-sm">
          <div className="flex-1 bg-[#FFF5F7] p-3 rounded-lg border-l-3 border-[#FF5A5F]">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-[#FF5A5F] mr-1" />
              <span className="font-medium">{events.length} upcoming {events.length === 1 ? 'event' : 'events'}</span>
            </div>
          </div>
          
          {firstEventDate && (
            <div className="flex-1 bg-[#FFF5F7] p-3 rounded-lg border-l-3 border-[#FF5A5F]">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-[#FF5A5F] mr-1" />
                <span className="font-medium text-[#FF5A5F]">{nextEventCountdown}: {sortedEvents[0].title}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Event list */}
      {sortedEvents.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <CalendarClock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No upcoming events</p>
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
                    event={event}
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