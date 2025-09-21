import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays } from 'lucide-react';
import { db } from '../firebase'; // Assuming this is how you import Firebase
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// Assuming SidePanel and EventCard are in the same components directory or adjust path
import SidePanel from './SidePanel';
import EventCard from './EventCard';
import TabHeader from './TabHeader';

// Helper: Format Date as YYYY-MM-DD using local time
const formatDate = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return ''; 

    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
};

// Helper: Convert 24-hour time to 12-hour time with AM/PM
const formatTime12Hour = (time) => {
    if (!time) return '';
    try {
        const [hours, minutes] = time.split(':');
        const hourNum = parseInt(hours, 10);
        if (isNaN(hourNum) || isNaN(parseInt(minutes, 10))) return 'Invalid Time';
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const hour12 = hourNum % 12 || 12;
        return `${hour12}:${minutes} ${period}`;
    } catch (e) {
        return 'Invalid Time';
    }
};


function CalendarTab({ events = [], onEventClick, onEventUpdate }) { 
  const [includePending, setIncludePending] = useState(() => {
    const stored = localStorage.getItem('calendarIncludePending');
    return stored ? stored === 'true' : false;
  });
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('calendarViewMode') || 'monthly';
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState({ date: null, events: [], notes: [] });

  const [calendarNotes, setCalendarNotes] = useState([]);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    id: null,
    title: '',
    content: '',
    color: '#4299e1',
    date: '',
  });

  // State for Event Card in SidePanel (from your uploaded version)
  const [selectedEventForPanel, setSelectedEventForPanel] = useState(null);
  const [isEventPanelOpen, setIsEventPanelOpen] = useState(false);

  const todayStr = useMemo(() => formatDate(new Date()), []);

  const fetchCalendarNotes = useCallback(async () => {
    try {
      const notesSnapshot = await getDocs(collection(db, "calendarNotes"));
      const notesData = notesSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setCalendarNotes(notesData);
    } catch (err) {
      console.error("Failed to load calendar notes:", err);
    }
  }, []);

  useEffect(() => {
    fetchCalendarNotes();
  }, [fetchCalendarNotes]);

  useEffect(() => {
    localStorage.setItem('calendarIncludePending', includePending.toString());
  }, [includePending]);

  useEffect(() => {
    localStorage.setItem('calendarViewMode', viewMode);
  }, [viewMode]);

  const filteredEvents = useMemo(() => {
    // This filtering is for events displayed directly on the calendar cells.
    // The Info Modal might show all events for the day regardless of this filter,
    // or you can apply a similar filter to events passed to the Info Modal.
    return events.filter(e =>
      includePending ? (e.status === 'upcoming' || e.status === 'maybe') : (e.status === 'upcoming')
    );
  }, [events, includePending]);

  const handlePrev = () => {
    setCurrentDate(prevDate => {
        const newDate = new Date(prevDate);
        if (viewMode === "monthly") {
            newDate.setMonth(newDate.getMonth() - 1);
            newDate.setDate(1); // Go to the first of the month to ensure correct month display
        } else { // weekly
            newDate.setDate(newDate.getDate() - 7);
        }
        return newDate;
    });
  };

  const handleNext = () => {
     setCurrentDate(prevDate => {
        const newDate = new Date(prevDate);
        if (viewMode === "monthly") {
            newDate.setMonth(newDate.getMonth() + 1);
            newDate.setDate(1); // Go to the first of the month
        } else { // weekly
            newDate.setDate(newDate.getDate() + 7);
        }
        return newDate;
     });
  };

  const openInfoModalForDate = useCallback((date, dayEvents, dayNotes) => {
    // Pass ALL events for that day to the info modal, not just the filtered ones for cell display
    const allEventsForDay = events.filter(e => e.eventDate === formatDate(date));
    setInfoModalContent({ date, events: allEventsForDay, notes: dayNotes });
    setInfoModalOpen(true);
  }, [events]); // Added events to dependency array

  const openNoteModalForAdd = useCallback((date) => {
    setNewNote({
      id: null, title: '', content: '', color: '#4299e1',
      date: formatDate(date),
    });
    setNoteModalOpen(true);
  }, []);

  const openNoteModalForEdit = useCallback((note) => {
    setNewNote({ ...note });
    setNoteModalOpen(true);
  }, []);

  const closeNoteModal = () => {
    setNoteModalOpen(false);
    setNewNote({ id: null, title: '', content: '', color: '#4299e1', date: '' });
  };

  const saveCalendarNote = async () => {
    if (!newNote.title || !newNote.date) {
      alert("Please enter a title and select a date for your note");
      return;
    }
    try {
      const noteData = {
          title: newNote.title, content: newNote.content,
          color: newNote.color, date: newNote.date,
      };
      if (newNote.id) {
        await updateDoc(doc(db, "calendarNotes", newNote.id), noteData);
        setCalendarNotes(prev => prev.map(note => note.id === newNote.id ? { id: newNote.id, ...noteData } : note));
      } else {
        const docRef = await addDoc(collection(db, "calendarNotes"), noteData);
        setCalendarNotes(prev => [...prev, { id: docRef.id, ...noteData }]);
      }
      closeNoteModal();
    } catch (err) {
      console.error("Failed to save calendar note:", err);
      alert("Failed to save note. Check console for details.");
    }
  };

  const deleteCalendarNote = async (id) => {
    if (!id || !window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteDoc(doc(db, "calendarNotes", id));
      setCalendarNotes(prev => prev.filter(note => note.id !== id));
      // Also update notes in the info modal if it's open for the same day
      setInfoModalContent(prev => ({
          ...prev,
          notes: prev.notes.filter(note => note.id !== id)
      }));
    } catch (err) {
      console.error("Failed to delete calendar note:", err);
      alert("Failed to delete note. Check console for details.");
    }
  };
  
  // --- Event Panel Handlers (from your uploaded version) ---
  const handleOpenEventPanel = (event) => {
    setSelectedEventForPanel(event);
    setIsEventPanelOpen(true);
    setInfoModalOpen(false); // Close info modal if it's open
    // The onEventClick prop from App.js is primarily for App.js's own SidePanel.
    // If CalendarTab opens its own panel, we might not need to call it,
    // or call it only if it's not the one that sets App.js's activeEvent.
    // For now, assuming onEventClick might be used for other logging or actions by App.js
    // but not to open App.js's main panel if CalendarTab is handling its own.
    if (onEventClick && typeof onEventClick === 'function') {
        // A more robust check might be needed if onEventClick's sole purpose is to open App.js's panel
        // For example, if onEventClick is always `(event) => setActiveEvent(event)` from App.js,
        // then calling it here would be redundant or conflicting.
        // If it has other side effects, it's fine.
        // onEventClick(event); // Commenting out for now to avoid potential double panel opening
    }
  };

  const handleCloseEventPanel = () => {
    setIsEventPanelOpen(false);
    setSelectedEventForPanel(null);
  };

  const handleSaveEventInPanel = async (updatedEvent) => {
    if (onEventUpdate) { // This prop should be passed from App.js
      try {
        await onEventUpdate(updatedEvent); 
        setSelectedEventForPanel(updatedEvent); // Update event in panel
        // Optionally, provide feedback to the user
        // alert("Event saved successfully!");
      } catch (error) {
        console.error("Failed to save event from CalendarTab's panel:", error);
        alert("Failed to save event. See console for details.");
      }
    } else {
      console.warn("CalendarTab: onEventUpdate prop not provided. Cannot save event changes from its panel.");
      // alert("Save functionality is not fully configured (onEventUpdate missing).");
    }
    // Decide whether to close panel on save or keep it open
    // handleCloseEventPanel(); 
  };


  const weeks = useMemo(() => {
    const weeksArray = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const allDays = [];

    if (viewMode === "monthly") {
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const firstDayWeekday = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
      
      const startDate = new Date(firstDayOfMonth);
      startDate.setDate(startDate.getDate() - firstDayWeekday); // Move to the Sunday of the first week

      const endDate = new Date(lastDayOfMonth);
      // Ensure the calendar grid always shows 6 weeks for consistent height if desired,
      // or ends on the Saturday of the last week containing days of the month.
      // For simplicity, ending on Saturday of the last week:
      if (lastDayOfMonth.getDay() < 6) { // If last day is not a Saturday
          endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));
      }
      // To ensure 6 weeks (42 days) for consistent layout:
      // let dayCount = 0;
      // while (dayCount < 42) { ... }
      // Or calculate end date based on 6 weeks from start date.
      // For now, using the logic that fills out the last week.

      let currentDay = new Date(startDate);
      let safety = 0; // Prevent infinite loops
      while (currentDay <= endDate && safety < 50) { 
        allDays.push(new Date(currentDay));
        currentDay.setDate(currentDay.getDate() + 1);
        safety++;
      }
    } else { // Weekly view
      const current = new Date(currentDate);
      const dayOfWeek = current.getDay();
      const weekStart = new Date(current);
      weekStart.setDate(current.getDate() - dayOfWeek); // Get Sunday of the current week
      for (let i = 0; i < 7; i++) {
        allDays.push(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
      }
    }
    for (let i = 0; i < allDays.length; i += 7) {
        weeksArray.push(allDays.slice(i, i + 7));
    }
    return weeksArray;
  }, [currentDate, viewMode]);


  return (
    <div className="p-4 relative w-full zoom-90">
      <div className="laptop:transform laptop:scale-[0.99] laptop:origin-top">
      <TabHeader
        icon={<CalendarDays className="h-7 w-7 text-blue-600" />}
        title="Calendar"
        actions={
          <button
            className="bg-green-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-600 whitespace-nowrap transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
            onClick={() => openNoteModalForAdd(new Date())}
          >
            Add Calendar Note
          </button>
        }
      />

      <div className="flex flex-wrap items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg gap-4 shadow">
        <div className="flex items-center mr-4 flex-shrink-0">
          <input
            type="checkbox"
            id="includePending"
            checked={includePending}
            onChange={(e) => setIncludePending(e.target.checked)}
            className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="includePending" className="text-sm text-gray-700 select-none cursor-pointer">Include Pending Events</label>
        </div>
        <div className="flex items-center space-x-4 flex-shrink-0">
          <label className="flex items-center cursor-pointer">
             <input type="radio" name="viewMode" value="monthly" checked={viewMode === 'monthly'} onChange={() => setViewMode("monthly")} className="mr-1 cursor-pointer text-blue-600 focus:ring-blue-500"/>
             <span className="text-sm text-gray-700 select-none">Monthly</span>
          </label>
          <label className="flex items-center cursor-pointer">
             <input type="radio" name="viewMode" value="weekly" checked={viewMode === 'weekly'} onChange={() => setViewMode("weekly")} className="mr-1 cursor-pointer text-blue-600 focus:ring-blue-500"/>
             <span className="text-sm text-gray-700 select-none">Weekly</span>
          </label>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrev} className="px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50">Previous</button>
        <h3 className="text-xl font-semibold text-gray-700 text-center mx-2 sm:mx-4">
          {viewMode === "monthly"
            ? `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`
            : `Week of ${weeks[0]?.[0]?.toLocaleDateString() ?? ''}`
          }
        </h3>
        <button onClick={handleNext} className="px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50">Next</button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-300">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-gray-200 border-b border-gray-300"> 
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <th key={day} className="p-2 w-[14.28%] text-xs sm:text-sm font-semibold text-gray-600 text-center">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((day, di) => {
                  const dateStr = formatDate(day);
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  // Use filteredEvents for cell display, but InfoModal gets all events for the day
                  const eventsForCellDisplay = filteredEvents.filter(e => e.eventDate === dateStr);
                  const notesForDay = calendarNotes.filter(n => n.date === dateStr);
                  const isToday = dateStr === todayStr;
                  const isPast = !isToday && day < new Date(new Date().setHours(0,0,0,0));
                  const cellItemsLimit = viewMode === 'monthly' ? 2 : 3; // Allow more items in weekly view cell

                  let cellBgClass = 'bg-white'; 
                  let cellTextClass = 'text-gray-700'; 
                  let cellOpacityClass = '';

                  if (isToday) {
                      cellBgClass = 'bg-blue-100'; 
                      cellTextClass = 'text-blue-800 font-semibold';
                  } else if (viewMode === 'monthly' && !isCurrentMonth) {
                      cellBgClass = 'bg-slate-50'; 
                      cellTextClass = 'text-gray-400';
                      cellOpacityClass = 'opacity-70'; 
                  } else if (isPast) {
                      cellBgClass = 'bg-gray-100'; 
                      cellTextClass = 'text-gray-500';
                  }

                  return (
                    <td
                      key={di}
                      className={`border border-gray-200 p-1.5 sm:p-2 w-[14.28%] h-28 min-h-[7rem] align-top relative transition-colors ${cellBgClass} ${cellTextClass} ${cellOpacityClass}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className={`text-xs sm:text-sm ${isToday ? 'text-blue-700 font-bold' : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}`}>
                          {day.getDate()}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); openInfoModalForDate(day, eventsForCellDisplay, notesForDay); }}
                          className={`p-0.5 rounded-full focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-400 transition-colors ${
                              isToday ? 'text-blue-700 hover:bg-blue-200'
                              : (viewMode === 'monthly' && !isCurrentMonth) ? 'text-gray-400 hover:bg-slate-200'
                              : isPast ? 'text-gray-500 hover:bg-gray-200'
                              : 'text-blue-600 hover:bg-blue-100'
                          }`}
                          title="View details / Add note"
                          aria-label={`Details for ${day.toLocaleDateString()}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>

                      <div className={`mt-1 space-y-0.5 overflow-hidden text-ellipsis`}>
                        {notesForDay.slice(0, cellItemsLimit).map((note) => (
                          <div
                            key={`note-${note.id}`}
                            style={{ backgroundColor: note.color || '#4299e1' }}
                            className="text-white text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded overflow-hidden whitespace-nowrap truncate block w-full text-left cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openNoteModalForEdit(note)}
                            title={note.title}
                          >
                            📌 {note.title}
                          </div>
                        ))}

                        {eventsForCellDisplay.slice(0, cellItemsLimit - notesForDay.length).map((event) => {
                           let timeStr = event.allDay ? "All Day" : formatTime12Hour(event.startTime) || '';
                          return (
                            <button
                              key={`event-${event.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEventPanel(event); // This opens CalendarTab's own panel
                              }}
                              className="bg-blue-500 text-white text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded overflow-hidden whitespace-nowrap truncate block w-full text-left focus:outline-none focus:ring-1 focus:ring-blue-300 hover:bg-blue-600 transition-opacity"
                              title={`${event.eventName || 'Unnamed'} ${timeStr ? `[${timeStr}]` : ''}`}
                            >
                              {event.eventName || 'Unnamed Event'}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Modal Overlay (using infoModalContent which gets all events for the day) */}
      {infoModalOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4" onClick={() => setInfoModalOpen(false)}>
          <div className="modal-content bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md relative max-h-[90vh] flex flex-col transform scale-[0.9] laptop:scale-100 laptop:translate-x-0 sm:laptop:translate-x-24 origin-top" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl leading-none p-1 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-full" onClick={() => setInfoModalOpen(false)} title="Close" aria-label="Close modal">&times;</button>
            <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">{infoModalContent.date ? infoModalContent.date.toDateString() : 'Details'}</h4>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
              <div>
                <h5 className="text-base font-semibold mb-2 text-gray-700">Notes</h5>
                {infoModalContent.notes.length > 0 && (
                  <ul className="space-y-2">
                    {infoModalContent.notes.map((note) => (
                      <li key={`modal-note-${note.id}`} className="flex justify-between items-start p-2 rounded border" style={{ backgroundColor: `${note.color}20` }}>
                        <div className="flex-1 mr-2">
                          <div className="font-semibold text-sm text-gray-800">{note.title}</div>
                          {note.content && <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap">{note.content}</p>}
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <button onClick={() => { setInfoModalOpen(false); openNoteModalForEdit(note); }} className="text-blue-600 hover:text-blue-800 text-xs font-medium p-1 rounded hover:bg-blue-100" title="Edit note">Edit</button>
                          <button onClick={() => deleteCalendarNote(note.id)} className="text-red-500 hover:text-red-700 text-xs font-medium p-1 rounded hover:bg-red-100" title="Delete note">Delete</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h5 className="text-base font-semibold mb-2 text-gray-700">Events</h5>
                {infoModalContent.events.length === 0 ? <p className="text-sm text-gray-500 italic">No events scheduled for this day.</p> : (
                  <ul className="space-y-2">
                    {infoModalContent.events.map((event) => { // Iterating over infoModalContent.events
                      const timeStr = event.allDay ? "All Day" : (formatTime12Hour(event.startTime) + (event.endTime ? ` - ${formatTime12Hour(event.endTime)}` : '')) || 'Not specified';
                      return (
                        <li key={`modal-event-${event.id}`} className="text-sm border rounded p-2.5 shadow-sm bg-gray-50 hover:shadow-md transition-shadow">
                          <div className="font-semibold text-gray-800">{event.eventName || 'Unnamed Event'}</div>
                          {event.clientName && <div className="text-xs text-gray-600 mt-0.5">Client: {event.clientName}</div>}
                          <div className="text-xs text-gray-600 mt-0.5">Time: {timeStr}</div>
                          {event.buildingArea && <div className="text-xs text-gray-600 mt-0.5">Area: {event.buildingArea}</div>}
                          <button
                            onClick={() => { setInfoModalOpen(false); handleOpenEventPanel(event); }} // Opens CalendarTab's panel
                            className="text-xs text-blue-600 hover:underline mt-1.5 font-medium"
                          >View Full Details / Edit</button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end border-t pt-3">
              <button onClick={() => { setInfoModalOpen(false); openNoteModalForAdd(infoModalContent.date); }}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-1.5 rounded shadow-sm font-medium transition-colors">Add Note for this Date</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Note Creation/Edit Modal (remains the same) */}
      {noteModalOpen && createPortal( /* ... your existing Note Modal JSX ... */ 
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={closeNoteModal}>
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md relative max-h-[90vh] flex flex-col transform scale-[0.9] laptop:scale-100 laptop:translate-x-0 sm:laptop:translate-x-24 origin-top" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">{newNote.id ? 'Edit Note' : 'Add Calendar Note'}</h4>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
              <div>
                <label htmlFor="noteTitle" className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input id="noteTitle" type="text" value={newNote.title} onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Enter note title" required />
              </div>
              <div>
                <label htmlFor="noteDate" className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                <input id="noteDate" type="date" value={newNote.date} onChange={(e) => setNewNote({ ...newNote, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note Color</label>
                <div className="flex space-x-2 flex-wrap gap-1">
                  {['#4299e1', '#48bb78', '#ed8936', '#f56565', '#9f7aea', '#667eea', '#ecc94b', '#38b2ac'].map(color => (
                    <button key={color} type="button" style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-full cursor-pointer border-2 transition-all ${newNote.color === color ? 'border-gray-700 ring-2 ring-offset-1 ring-gray-500 scale-110' : 'border-transparent hover:scale-105'}`}
                      onClick={() => setNewNote({ ...newNote, color })} aria-label={`Select color ${color}`} />
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="noteContent" className="block text-sm font-medium text-gray-700 mb-1">Content (optional)</label>
                <textarea id="noteContent" value={newNote.content} onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 min-h-[100px]" placeholder="Add details (optional)" rows="4" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6 border-t pt-4">
              <button type="button" onClick={closeNoteModal} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="button" onClick={saveCalendarNote} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">{newNote.id ? 'Update Note' : 'Save Note'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Side Panel for Event Card (from your uploaded version) */}
      {isEventPanelOpen && selectedEventForPanel && (
        <SidePanel
          isOpen={isEventPanelOpen}
          onClose={handleCloseEventPanel}
          title={`Event Details: ${selectedEventForPanel.eventName || 'Unnamed Event'}`}
        >
          <EventCard
            event={selectedEventForPanel}
            onSave={handleSaveEventInPanel} // This should call App.js's update logic
            setActiveEvent={handleCloseEventPanel} // Allows EventCard's close to close this panel
            hideActions={false} // Assuming EventCard might have its own save/actions for this panel
          />
        </SidePanel>
      )}
      </div>
    </div>
  );
}

export default CalendarTab;
