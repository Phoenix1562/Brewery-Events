// components/MaybeTab.js
import React from 'react';
import EventPreviewCard from './EventPreviewCard';
import TabHeader from './TabHeader';
import { PlusCircle, Calendar, Clock } from 'lucide-react';

function MaybeTab({ events, addEvent, onSelectEvent }) {
  return (
    <div className="p-6 rounded-2xl border border-surface-700 bg-surface-900 text-surface-50 shadow-lg">
      <TabHeader
        icon={(
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-800 text-lagoon-300">
            <Clock className="h-6 w-6" />
          </span>
        )}
        title="Pending Events"
        titleClassName="text-surface-50"
        actions={
          <button
            onClick={addEvent}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-lagoon-300 to-lagoon-400 px-4 py-2 text-surface-900 shadow-sm transition-all duration-200 hover:from-lagoon-200 hover:to-lagoon-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-lagoon-300 focus:ring-offset-2 focus:ring-offset-surface-900"
          >
            <PlusCircle className="h-5 w-5" />
            <span>New Event</span>
          </button>
        }
      />
      
      {/* Counter badge */}
      {events.length > 0 && (
        <div className="mb-6 flex">
          <div className="rounded-full border border-lagoon-400/60 bg-surface-800/80 px-4 py-2 text-sm font-medium text-lagoon-200">
            {events.length} pending {events.length === 1 ? 'event' : 'events'}
          </div>
        </div>
      )}

      {/* Event list */}
      {events.length === 0 ? (
        <div className="text-center rounded-2xl border border-surface-600 bg-surface-800/80 py-12">
          <Calendar className="h-12 w-12 text-lagoon-200 mx-auto mb-4" />
          <p className="mb-2 text-surface-200">No pending events</p>
          <button
            onClick={addEvent}
            className="mt-4 inline-flex items-center font-medium text-lagoon-200 transition-colors hover:text-lagoon-100"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Create your first event
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <EventPreviewCard
              key={event.id}
              event={event}
              onClick={() => onSelectEvent(event)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MaybeTab;