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

  const handleSidePanelClose = () => {
    if (eventCardRef.current && typeof eventCardRef.current.handleClose === 'function') {
      eventCardRef.current.handleClose(); // This calls EventCard's internal close, which should call setActiveEvent(null)
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


  const moveEvent = async (id, newStatus) => {
    const eventToUpdate = events.find(event => event.id === id);
    if (!eventToUpdate) return;
    const updatedEventData = { // Renamed to avoid conflict with 'updatedEvent' variable name if it's in a broader scope
      ...eventToUpdate,
      status: newStatus,
      ...(newStatus === 'finished' &&
        (!eventToUpdate.eventDate || isNaN(new Date(eventToUpdate.eventDate))) && {
          eventDate: new Date().toISOString().split('T')[0]
        }
      )
    };
    try {
      await updateDoc(doc(db, "events", id), updatedEventData);
      setEvents(prev => prev.map(event => (event.id === id ? updatedEventData : event)));
    } catch (err) {
      console.error("Error moving event:", err);
    }
  };

  const handleMoveLeftEvent = (id) => {
    const event = events.find(e => e.id === id);
    if (!event) return;
    if (event.status === 'upcoming') {
      moveEvent(id, 'maybe');
    } else if (event.status === 'finished') {
      moveEvent(id, 'upcoming');
    }
  };

  const handleMoveRightEvent = (id) => {
    const event = events.find(e => e.id === id);
    if (!event) return;
    if (event.status === 'maybe') {
      moveEvent(id, 'upcoming');
    } else if (event.status === 'upcoming') {
      moveEvent(id, 'finished');
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
            footer={
              <AnimatePresence>
                {activeEvent && ( // Re-check activeEvent for the motion component
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                    className="rounded-2xl border border-gray-200 bg-white/85 p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            if (eventCardRef.current && typeof eventCardRef.current.handleClose === 'function') {
                              eventCardRef.current.handleClose();
                            } else {
                              saveEvent(activeEvent);
                              setActiveEvent(null);
                            }
                          }}
                          className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600"
                        >
                          Save & Close
                        </button>
                        {activeEvent.status !== 'finished' && (
                          <button
                            onClick={() => handleMoveRightEvent(activeEvent.id)}
                            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
                          >
                            {activeEvent.status === 'maybe'
                              ? 'Move to Upcoming Events →'
                              : activeEvent.status === 'upcoming'
                                ? 'Move to Finished Events →'
                                : 'Move Right →'}
                          </button>
                        )}
                        {activeEvent.status !== 'maybe' && (
                          <button
                            onClick={() => handleMoveLeftEvent(activeEvent.id)}
                            className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                          >
                            {activeEvent.status === 'upcoming'
                              ? '← Move to Pending Events'
                              : activeEvent.status === 'finished'
                                ? '← Move to Upcoming Events'
                                : '← Move Left'}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => deleteEvent(activeEvent.id)}
                          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                        <button
                          onClick={handleSidePanelClose}
                          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
                        >
                          Cancel / Close
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            }
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
