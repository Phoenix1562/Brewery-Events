// App.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import MaybeTab from './components/MaybeTab';
import UpcomingTab from './components/UpcomingTab';
import FinishedTab from './components/FinishedTab';
import StatisticsTab from './components/StatisticsTab';
import CalendarTab from './components/CalendarTab'; // Ensure this is the updated CalendarTab
import ExportModal from './components/ExportModal';
import AuthForm from './components/AuthForm';
import SidePanel from './components/SidePanel';
import EventCard from './components/EventCard';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { exportEventsToExcel } from './utils/export';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, ArrowRight, ArrowLeft, Trash2, X } from 'lucide-react';

function App() {
  const [currentTab, setCurrentTab] = useState('maybe');
  const [events, setEvents] = useState([]);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState(null); // For App.js's main SidePanel

  const sidePanelRef = useRef(null);
  const eventCardRef = useRef(null);

  const allowedEmails = useMemo(() => [
    'knuthmitchell@gmail.com',
    'jknuth@johnsonville.com',
  ], []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser && !allowedEmails.includes(currentUser.email)) {
        alert("Sorry, your email is not permitted to access this app.");
        signOut(auth);
      }
    });
    return () => unsubscribe();
  }, [allowedEmails]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const snapshot = await getDocs(collection(db, "events"));
        const loadedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(loadedEvents);
      } catch (err) {
        console.error("Error loading events:", err);
      }
    };
    fetchEvents();
  }, []);

  const handleSidePanelClose = async () => {
    if (eventCardRef.current && typeof eventCardRef.current.handleClose === 'function') {
      try {
        await eventCardRef.current.handleClose(); // This calls EventCard's internal close, which should call setActiveEvent(null)
      } catch (err) {
        console.error('Error closing event card:', err);
        setActiveEvent(null); // Ensure panel closes even if the card throws
      }
    } else {
      setActiveEvent(null); // Fallback if ref or method not available
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        activeEvent &&
        sidePanelRef.current &&
        !sidePanelRef.current.contains(event.target)
      ) {
        handleSidePanelClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeEvent]); // Dependency on activeEvent

  const addEvent = async () => {
    const newEvent = {
      clientName: '',
      eventName: '',
      eventDate: '',
      buildingArea: '',
      priceGiven: '',
      downPaymentRequired: '',
      downPaymentReceived: false,
      amountDueAfter: '',
      amountPaidAfter: '',
      grandTotal: '',
      securityDeposit: '',
      notes: '',
      status: 'maybe',
      createdAt: new Date().toISOString(),
      files: []
    };
    try {
      const docRef = await addDoc(collection(db, 'events'), newEvent);
      setEvents(prev => [...prev, { id: docRef.id, ...newEvent }]);
    } catch (err) {
      console.error("Error saving event:", err);
    }
  };

  const saveEvent = async (updatedEvent) => {
  try {
    const { id, ...fields } = updatedEvent;
    if (!id) {
      // It's good practice to ensure an ID exists before trying to update a document
      console.error("Event ID is missing in updatedEvent, cannot save.", updatedEvent);
      throw new Error("Cannot save event without an ID."); // Or handle more gracefully
    }
    await updateDoc(doc(db, "events", id), fields);
    setEvents(prevEvents => prevEvents.map(e => (e.id === id ? updatedEvent : e)));

    // REMOVE or COMMENT OUT THIS BLOCK:
    /*
    if (activeEvent && activeEvent.id === id) {
      setActiveEvent(updatedEvent); 
    }
    */
   // The EventCard will reflect the new data if it were to remain open due to a different action.
   // If closing, EventCard's setActiveEvent(null) will handle closing.
   // The main 'events' list is updated, so re-opening the event later will show fresh data.

  } catch (err) {
    console.error("Error saving event:", err);
    // You might want to throw the error or set an error state to inform the user
    // For example: setSaveError("Failed to save event. Please try again.");
  }
};


  const prepareEventForStatusChange = async (id) => {
    let baseEvent = events.find(e => e.id === id);

    if (activeEvent && activeEvent.id === id && eventCardRef.current) {
      try {
        if (typeof eventCardRef.current.triggerSave === 'function') {
          await eventCardRef.current.triggerSave();
        }
        if (typeof eventCardRef.current.getCurrentEvent === 'function') {
          baseEvent = eventCardRef.current.getCurrentEvent() || baseEvent;
        }
      } catch (err) {
        console.error('Error saving event before moving:', err);
      }
    }

    return baseEvent;
  };

  const moveEvent = async (eventOrId, newStatus) => {
    const eventToUpdate =
      typeof eventOrId === 'object' && eventOrId !== null
        ? eventOrId
        : events.find(event => event.id === eventOrId);

    if (!eventToUpdate || !eventToUpdate.id) return;

    const eventId = eventToUpdate.id;
    const updatedEventData = {
      ...eventToUpdate,
      status: newStatus,
      ...(newStatus === 'finished' &&
        (!eventToUpdate.eventDate || isNaN(new Date(eventToUpdate.eventDate))) && {
          eventDate: new Date().toISOString().split('T')[0]
        }
      )
    };
    try {
      await updateDoc(doc(db, "events", eventId), updatedEventData);
      setEvents(prev => prev.map(event => (event.id === eventId ? updatedEventData : event)));
      if (activeEvent && activeEvent.id === eventId) {
        setActiveEvent(null);
      }
    } catch (err) {
      console.error("Error moving event:", err);
    }
  };

  const handleMoveLeftEvent = async (id) => {
    const event = await prepareEventForStatusChange(id);
    if (!event) return;

    if (event.status === 'upcoming') {
      await moveEvent(event, 'maybe');
    } else if (event.status === 'finished') {
      await moveEvent(event, 'upcoming');
    }
  };

  const handleMoveRightEvent = async (id) => {
    const event = await prepareEventForStatusChange(id);
    if (!event) return;

    if (event.status === 'maybe') {
      await moveEvent(event, 'upcoming');
    } else if (event.status === 'upcoming') {
      await moveEvent(event, 'finished');
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteDoc(doc(db, "events", id));
      setEvents(prev => prev.filter(event => event.id !== id));
      // If the deleted event was active in App.js's panel, close the panel
      if (activeEvent && activeEvent.id === id) {
        setActiveEvent(null);
      }
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  const filteredEvents = events.filter(e => e.status === currentTab);

  const renderTab = () => {
    const commonTabProps = { // Renamed to avoid confusion with 'props' in function signature
      events: filteredEvents,
      onSave: saveEvent,
      onMoveLeft: handleMoveLeftEvent,
      onMoveRight: handleMoveRightEvent,
      onDelete: deleteEvent,
      onSelectEvent: (event) => setActiveEvent(event), // This opens App.js's main SidePanel
    };

    switch (currentTab) {
      case 'maybe':
        return <MaybeTab {...commonTabProps} addEvent={addEvent} />;
      case 'upcoming':
        return <UpcomingTab {...commonTabProps} />;
      case 'finished':
        return <FinishedTab {...commonTabProps} onMoveRight={null} />; // FinishedTab doesn't need moveRight
      case 'statistics':
        return <StatisticsTab events={events} />; // StatisticsTab uses all events
      case 'calendar':
        return (
          <CalendarTab
            events={events}
            onEventUpdate={saveEvent}
            onEventClick={(calendarClickedEvent) => {
              console.log('Event click from CalendarTab. Panel handled by CalendarTab. Event ID:', calendarClickedEvent.id);
            }}
          />
        );
      default:
        return null;
    }
  };

  const handleExportConfirm = (filterOptions) => {
    exportEventsToExcel(events, filterOptions);
  };

  useEffect(() => {
    setActiveEvent(null); // Close App.js's main SidePanel when changing tabs
  }, [currentTab]);

  if (loading) return <div className="text-center py-10">Loading application data...</div>;
  if (!user) return <AuthForm />;

  // --- Button Definitions ---
  const ActionButton = ({ onClick, icon: Icon, label, colorClass = "bg-white text-slate-700 hover:bg-slate-50 border-slate-200" }) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-sm transition-all hover:scale-[1.02] hover:shadow-md focus:ring-2 focus:ring-offset-1 disabled:opacity-50 xl:w-full xl:justify-start ${colorClass}`}
      title={label}
    >
      {Icon && <Icon size={18} />}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );

  const renderActions = () => {
    if (!activeEvent) return null;

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center xl:flex-col xl:items-stretch">
            <ActionButton
                onClick={async () => {
                    if (eventCardRef.current && typeof eventCardRef.current.handleClose === 'function') {
                        try {
                            await eventCardRef.current.handleClose();
                        } catch (err) {
                            console.error('Error saving before closing:', err);
                            setActiveEvent(null);
                        }
                    } else {
                        await saveEvent(activeEvent);
                        setActiveEvent(null);
                    }
                }}
                icon={Save}
                label="Save & Close"
                colorClass="bg-green-600 text-white border-transparent hover:bg-green-700 focus:ring-green-500"
            />

            <div className="flex gap-3 sm:contents xl:flex xl:flex-col xl:gap-3">
                 {activeEvent.status !== 'maybe' && (
                    <ActionButton
                        onClick={() => handleMoveLeftEvent(activeEvent.id)}
                        icon={ArrowLeft}
                        label={
                            activeEvent.status === 'upcoming' ? 'To Pending' :
                            activeEvent.status === 'finished' ? 'To Upcoming' : 'Move Left'
                        }
                        colorClass="bg-white text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                    />
                )}

                {activeEvent.status !== 'finished' && (
                    <ActionButton
                        onClick={() => handleMoveRightEvent(activeEvent.id)}
                        icon={ArrowRight}
                        label={
                            activeEvent.status === 'maybe' ? 'To Upcoming' :
                            activeEvent.status === 'upcoming' ? 'To Finished' : 'Move Right'
                        }
                        colorClass="bg-blue-600 text-white border-transparent hover:bg-blue-700 focus:ring-blue-500"
                    />
                )}
            </div>

            <div className="mt-2 h-px bg-slate-200 xl:my-2"></div>

             <div className="flex gap-3 sm:contents xl:flex xl:flex-col xl:gap-3">
                 <ActionButton
                    onClick={() => deleteEvent(activeEvent.id)}
                    icon={Trash2}
                    label="Delete"
                    colorClass="bg-white text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                 />
             </div>
        </div>
    );
  };


  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onExport={() => setExportModalVisible(true)}
      />

      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto relative"> {/* Changed div to main for semantics */}
        {renderTab()}
      </main>

      {/* SidePanel managed by App.js (for MaybeTab, UpcomingTab, FinishedTab clicks) */}
      {activeEvent && (
        <div ref={sidePanelRef}> {/* Ensure this div captures clicks for outside click detection */}
          <SidePanel
            isOpen={!!activeEvent}
            onClose={handleSidePanelClose} // Use the refined handler
            title={activeEvent.eventName || 'Event Details'}
            actions={renderActions()} // Pass actions prop
          >
            <EventCard
              ref={eventCardRef} // Pass ref to EventCard
              event={activeEvent}
              onMoveLeft={handleMoveLeftEvent}
              onMoveRight={handleMoveRightEvent}
              onDelete={deleteEvent}
              onSave={saveEvent} // EventCard in App.js's panel uses saveEvent directly
              setActiveEvent={setActiveEvent} // To allow EventCard to close App.js's panel
              active={true} // This EventCard is active when SidePanel is open
              hideActions={true} // Using external action panel in App.js
            />
          </SidePanel>
        </div>
      )}

      <ExportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        onConfirm={handleExportConfirm}
      />
    </div>
  );
}

export default App;
