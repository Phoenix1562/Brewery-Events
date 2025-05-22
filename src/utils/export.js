import * as XLSX from 'xlsx';

// Utility: sort events by date, placing events without a date at the end.
const sortByDate = (arr) => {
  return arr.sort((a, b) => {
    if (!a.eventDate) return 1;
    if (!b.eventDate) return -1;
    return new Date(a.eventDate) - new Date(b.eventDate);
  });
};

// Transforms an event into an object with specific fields for export.
const formatEventForExport = (event, includeMoney) => {
  const eventTime = event.startTime
    ? event.endTime
      ? `${event.startTime} - ${event.endTime}`
      : event.startTime
    : 'N/A';

  const base = {
    'Client Name': event.clientName || '',
    'Event Name': event.eventName || '',
    'Event Date': event.eventDate ? new Date(event.eventDate) : '', 
    'Event Time': eventTime,
    'Building Area': event.buildingArea || '',
    'Number of Guests': event.numberOfGuests || '',
    'All Day': event.allDay ? 'Yes' : 'No',
    // "Form Sent" and "Form Received Date" are removed as per your request
  };

  if (includeMoney) {
    base['Price Given'] = event.priceGiven || '';
    base['Down Payment Required'] = event.downPaymentRequired || '';
    base['Down Payment Received'] = event.downPaymentReceived ? 'Yes' : 'No';
    base['Down Payment Received Date'] = event.downPaymentReceivedDate ? new Date(event.downPaymentReceivedDate) : ''; // Kept
    base['Food/Beverage/Other Costs'] = event.amountPaidAfter || '';
    base['Grand Total'] = event.grandTotal || '';
    base['Security Deposit'] = event.securityDeposit || '';
  }
  
  base['Final Payment Received'] = event.finalPaymentReceived ? 'Yes' : 'No';
  base['Final Payment Received Date'] = event.finalPaymentReceivedDate ? new Date(event.finalPaymentReceivedDate) : '';
  base['Notes'] = event.notes || '';

  return base;
};

// Helper function to filter events by date range
const filterEventsByDateRange = (eventsToFilter, dateConfig) => {
  // If applyDateRange is false (or not present), or no dates are set, return all events for that status
  if (!dateConfig || !dateConfig.applyDateRange || (!dateConfig.startDate && !dateConfig.endDate)) {
    return eventsToFilter;
  }

  return eventsToFilter.filter(event => {
    if (!event.eventDate) return false; 

    const eventD = new Date(event.eventDate);
    const eventDateOnly = new Date(Date.UTC(eventD.getUTCFullYear(), eventD.getUTCMonth(), eventD.getUTCDate()));

    let SDate = null;
    if (dateConfig.startDate) {
      const [sYear, sMonth, sDay] = dateConfig.startDate.split('-').map(Number);
      SDate = new Date(Date.UTC(sYear, sMonth - 1, sDay));
    }

    let EDate = null;
    if (dateConfig.endDate) {
      const [eYear, eMonth, eDay] = dateConfig.endDate.split('-').map(Number);
      EDate = new Date(Date.UTC(eYear, eMonth - 1, eDay));
    }

    if (SDate && EDate) {
      return eventDateOnly >= SDate && eventDateOnly <= EDate;
    } else if (SDate) {
      return eventDateOnly >= SDate;
    } else if (EDate) {
      return eventDateOnly <= EDate;
    }
    // If applyDateRange is true but specific dates are blank, it implies an open range for that end.
    // The function currently returns all if BOTH are blank and applyDateRange is true due to the top check.
    // If only one is blank, the single-ended range comparison above handles it.
    return true; 
  });
};

/**
 * Exports events to an Excel file with sheets based on selection.
 * @param {Array} events - Array of all event objects.
 * @param {Object} filterOptions - { reportType: string, exportSheets: { finished: boolean, upcoming: boolean }, configurations: { finished: object, upcoming: object } }
 */
export const exportEventsToExcel = (events, filterOptions = {}) => {
  const includeMoney = filterOptions.reportType === 'internal';
  const exportSheetsConfig = filterOptions.exportSheets;
  const configs = filterOptions.configurations;

  if (!exportSheetsConfig || !configs || !configs.finished || !configs.upcoming) {
    console.error("Export configurations or sheet selection is missing.");
    alert("Export error: Configuration or sheet selection missing.");
    return;
  }

  const workbook = XLSX.utils.book_new();
  let sheetsAdded = 0;

  // Helper function to add a sheet to the workbook.
  const addSheet = (data, sheetTitle) => {
    if (!data || data.length === 0) {
      const noDataMessage = [{ Message: `No events found for ${sheetTitle} with the selected filters.` }];
      const ws = XLSX.utils.json_to_sheet(noDataMessage);
      XLSX.utils.book_append_sheet(workbook, ws, sheetTitle.substring(0, 30)); // Sheet names max 31 chars
      sheetsAdded++;
      return;
    }
    
    const headersOrder = Object.keys(data[0]);
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headersOrder, skipHeader: false, dateNF: 'mm-dd-yyyy' }); // Ensure dates are written as dates
    
    const cols = headersOrder.map(header => {
        switch(header) {
            case 'Client Name': case 'Event Name': return { wch: 25 };
            case 'Event Date': 
            // "Form Received Date" was removed
            case 'Down Payment Received Date': // Kept
            case 'Final Payment Received Date': 
                return { wch: 15, z: 'mm-dd-yyyy' }; // Excel date format
            case 'Event Time': return { wch: 18 };
            case 'Notes': return { wch: 40 };
            case 'Building Area': case 'Number of Guests': case 'Price Given':
            case 'Food/Beverage/Other Costs': case 'Grand Total': case 'Security Deposit': return { wch: 18 };
            case 'Down Payment Required': return { wch: 22 };
            case 'All Day': 
            // "Form Sent" was removed
            case 'Down Payment Received': 
            case 'Final Payment Received': 
                return { wch: 12 }; // For Yes/No fields
            default: return { wch: 15 }; // Default width
        }
    });
    worksheet['!cols'] = cols;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle.substring(0, 30));
    sheetsAdded++;
  };
  
  // Process and add "Finished Events" sheet if selected
  if (exportSheetsConfig.finished) {
    const finishedConfig = configs.finished;
    let finishedRawEvents = events.filter(event => event.status === 'finished');
    let finishedFilteredByDate = filterEventsByDateRange(finishedRawEvents, finishedConfig);
    const processedFinishedEvents = sortByDate(finishedFilteredByDate)
      .map(e => formatEventForExport(e, includeMoney));
    addSheet(processedFinishedEvents, "Finished Events");
  }

  // Process and add "Upcoming Events" sheet if selected
  if (exportSheetsConfig.upcoming) {
    const upcomingConfig = configs.upcoming;
    // Decide if 'maybe' status should be included with 'upcoming' or be its own category
    let upcomingRawEvents = events.filter(event => event.status === 'upcoming' /* || event.status === 'maybe' */);
    let upcomingFilteredByDate = filterEventsByDateRange(upcomingRawEvents, upcomingConfig);
    const processedUpcomingEvents = sortByDate(upcomingFilteredByDate)
      .map(e => formatEventForExport(e, includeMoney));
    addSheet(processedUpcomingEvents, "Upcoming Events");
  }
  
  // If no sheets were added (e.g., both toggles off, or data was empty for selected toggles)
  if (sheetsAdded === 0) {
    alert("No data to export based on your selections. Please check your filters or sheet inclusion toggles.");
    return;
  }

  // Generate a filename
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Event_Report_${filterOptions.reportType}_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};