// components/MaybeTab.js
import React from 'react';
import EventPreviewCard from './EventPreviewCard';
import TabHeader from './TabHeader';
import { PlusCircle, Calendar, Clock } from 'lucide-react';

function MaybeTab({ events, addEvent, onSelectEvent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <TabHeader
        icon={<Clock className="h-7 w-7 text-sky-500" />}
        title="Pending Events"
        actions={
          <button
            onClick={addEvent}
            className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-sky-600"
          >
            <PlusCircle className="h-5 w-5" />
            <span>New Event</span>
          </button>
        }
      />
      
      {/* Counter badge */}
      {events.length > 0 && (
        <div className="mb-6 grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sky-500">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">In review</p>
              <p className="font-semibold text-slate-700">{events.length} pending {events.length === 1 ? 'event' : 'events'}</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sky-500">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Convert quickly</p>
              <p className="text-sm text-slate-600">Move confirmed bookings to Upcoming</p>
            </div>
          </div>
        </div>
      )}

      {/* Event list */}
      {events.length === 0 ? (
        <div className="rounded-lg bg-slate-50 py-12 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <p className="mb-2 text-slate-500">No pending events</p>
          <button
            onClick={addEvent}
            className="mt-4 inline-flex items-center font-medium text-sky-600 transition-colors hover:text-sky-700"
          >
            <PlusCircle className="mr-1 h-4 w-4" />
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
