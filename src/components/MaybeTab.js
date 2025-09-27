// components/MaybeTab.js
import React from 'react';
import EventPreviewCard from './EventPreviewCard';
import TabHeader from './TabHeader';
import { PlusCircle, Calendar, Clock } from 'lucide-react';

function MaybeTab({ events, addEvent, onSelectEvent }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-amber-50/40 p-6 shadow-sm">
      <TabHeader
        icon={<Clock className="h-7 w-7 text-amber-500" />}
        title="Pending Events"
        actions={
          <button
            onClick={addEvent}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            <PlusCircle className="h-5 w-5" />
            <span>New Event</span>
          </button>
        }
      />
      
      {/* Counter badge */}
      {events.length > 0 && (
        <div className="mb-6 grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-amber-200/60 bg-white px-4 py-3 shadow-inner">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-amber-500">In review</p>
              <p className="font-semibold text-gray-700">{events.length} pending {events.length === 1 ? 'event' : 'events'}</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 rounded-xl border border-amber-200/60 bg-white px-4 py-3 shadow-inner">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10">
              <Calendar className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-amber-500">Convert quickly</p>
              <p className="text-sm text-gray-600">Move confirmed bookings to Upcoming</p>
            </div>
          </div>
        </div>
      )}

      {/* Event list */}
      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No pending events</p>
          <button
            onClick={addEvent}
            className="mt-4 inline-flex items-center text-amber-600 hover:text-amber-700 font-medium"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Create your first event
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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