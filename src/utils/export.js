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
    'Form Sent': event.formSent ? 'Yes' : 'No',
    'Form Received Date': event.formReceivedDate ? new Date(event.formReceivedDate) : '',
  };

  if (includeMoney) {
    base['Price Given'] = event.priceGiven || '';
    base['Down Payment Required'] = event.downPaymentRequired || '';
    base['Down Payment Received'] = event.downPaymentReceived ? 'Yes' : 'No';
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
  if (!dateConfig.applyDateRange || (!dateConfig.startDate && !dateConfig.endDate)) {
    return eventsToFilter; // No date filter to apply or toggle is off
  }

  return eventsToFilter.filter(event => {
    if (!event.eventDate) return false; // Cannot filter if event has no date

    const eventD = new Date(event.eventDate);
    // Normalize to UTC midnight for date-only comparison
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
    return true; // If applyDateRange is true but dates are blank, effectively no range constraint
  });
};

/**
 * Exports events to an Excel file with two sheets (Finished, Upcoming),
 * each configured with its own filters.
 * @param {Array} events - Array of all event objects.
 * @param {Object} filterOptions - { reportType: string, configurations: { finished: object, upcoming: object } }
 */
export const exportEventsToExcel = (events, filterOptions = {}) => {
  const includeMoney = filterOptions.reportType === 'internal';
  const configs = filterOptions.configurations;

  if (!configs || !configs.finished || !configs.upcoming) {
    console.error("Export configurations for finished and upcoming events are missing.");
    alert("Export error: Configuration missing.");
    return;
  }

  // --- Process Finished Events ---
  const finishedConfig = configs.finished;
  let finishedRawEvents = events.filter(event => event.status === 'finished');
  let finishedFilteredByDate = filterEventsByDateRange(finishedRawEvents, finishedConfig);
  const processedFinishedEvents = sortByDate(finishedFilteredByDate)
    .map(e => formatEventForExport(e, includeMoney));

  // --- Process Upcoming Events ---
  const upcomingConfig = configs.upcoming;
  let upcomingRawEvents = events.filter(event => event.status === 'upcoming');
  // Also consider 'maybe' status for upcoming if that's intended
  // let upcomingRawEvents = events.filter(event => event.status === 'upcoming' || event.status === 'maybe');
  let upcomingFilteredByDate = filterEventsByDateRange(upcomingRawEvents, upcomingConfig);
  const processedUpcomingEvents = sortByDate(upcomingFilteredByDate)
    .map(e => formatEventForExport(e, includeMoney));

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Helper function to add a sheet to the workbook.
  const addSheet = (data, sheetTitle) => {
    if (!data || data.length === 0) {
      const noDataMessage = [{ Message: `No events found for ${sheetTitle} with the selected filters.` }];
      const ws = XLSX.utils.json_to_sheet(noDataMessage);
      XLSX.utils.book_append_sheet(workbook, ws, sheetTitle.substring(0, 30));
      return;
    }
    
    const headersOrder = Object.keys(data[0]);
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headersOrder, skipHeader: false });
    
    const cols = headersOrder.map(header => {
        switch(header) {
            case 'Client Name': case 'Event Name': return { wch: 25 };
            case 'Event Date': case 'Form Received Date': case 'Final Payment Received Date': return { wch: 15, z: 'mm-dd-yyyy' };
            case 'Event Time': return { wch: 18 };
            case 'Notes': return { wch: 40 };
            case 'Building Area': case 'Number of Guests': case 'Price Given':
            case 'Food/Beverage/Other Costs': case 'Grand Total': case 'Security Deposit': return { wch: 18 };
            case 'Down Payment Required': return { wch: 22 };
            case 'All Day': case 'Form Sent': case 'Down Payment Received': case 'Final Payment Received': return { wch: 12 };
            default: return { wch: 15 };
        }
    });
    worksheet['!cols'] = cols;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle.substring(0, 30));
  };

  // Add both sheets to the workbook
  addSheet(processedFinishedEvents, "Finished Events");
  addSheet(processedUpcomingEvents, "Upcoming Events");

  // Generate a filename
  const dateStr = new Date().toISOString().split('T')[0];
  // Filename can be more generic since it contains multiple sheets now
  const fileName = `Event_Report_${filterOptions.reportType}_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};