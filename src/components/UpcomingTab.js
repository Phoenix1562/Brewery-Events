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

  // Group events by month for better visualization
  const groupedEvents = useMemo(() => {
    const groups = {};
    sortedEvents.forEach((event) => {
      // Create date using UTC to avoid timezone issues
      const dateStr = event.eventDate;
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));

      const monthYear = `${date.toLocaleString('default', { month: 'long', timeZone: 'UTC' })} ${date.getUTCFullYear()}`;

      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(event);
    });
    return groups;
  }, [sortedEvents]);

  // Calculate how soon the first event is
  const nextEventCountdown = useMemo(() => {
    if (!firstEventDate) return null;

    const dateStr = firstEventDate;
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);

    const today = new Date();
    const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const eventUTC = Date.UTC(year, month - 1, day);

    const diffTime = eventUTC - todayUTC;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    if (diffDays < 30) {
      const weeks = Math.ceil(diffDays / 7);
      return `In ${weeks} week${weeks === 1 ? '' : 's'}`;
    }
    const months = Math.ceil(diffDays / 30);
    return `In ${months} month${months === 1 ? '' : 's'}`;
  }, [firstEventDate]);

  // Format date properly using UTC to avoid timezone issues
  const formatEventDate = (dateString) => {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC' // Ensure consistent display regardless of local timezone
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center mb-6">
        <CalendarClock className="h-6 w-6 text-[#FF5A5F] mr-2" />
        <h2 className="text-2xl font-bold text-gray-800">Upcoming Events</h2>
      </div>

      {/* Summary section */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#FFF5F7] p-4 rounded-lg border-l-4 border-[#FF5A5F]">
          <div className="flex items-center mb-2">
            <CheckCircle className="h-5 w-5 text-[#FF5A5F] mr-2" />
            <h3 className="text-lg font-medium text-gray-700">Event Summary</h3>
          </div>
          <p className="text-gray-600 mb-2">
            You have <span className="font-medium">{events.length}</span> upcoming {events.length === 1 ? 'event' : 'events'}
          </p>
          {firstEventDate && (
            <p className="text-sm text-gray-500">
              Next event: {formatEventDate(firstEventDate)}
            </p>
          )}
        </div>

        {firstEventDate && (
          <div className="bg-[#FFF5F7] p-4 rounded-lg border-l-4 border-[#FF5A5F]">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-[#FF5A5F] mr-2" />
              <h3 className="text-lg font-medium text-[#FF5A5F]">Coming Up {nextEventCountdown}</h3>
            </div>
            <p className="text-[#FF5A5F]">
              {sortedEvents[0].title}
            </p>
          </div>
        )}
      </div>

      {/* Event list */}
      {sortedEvents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CalendarClock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">You're all caught up!</p>
          <p className="text-sm text-gray-400">No upcoming events at the moment</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
            <div key={monthYear}>
              <h3 className="text-md font-medium text-gray-700 mb-4 pb-2 border-b">
                {monthYear}
              </h3>
              <div className="space-y-4">
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
