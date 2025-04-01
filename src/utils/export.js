import * as XLSX from 'xlsx';

// Utility: sort events by date, placing events without a date at the end.
const sortByDate = (arr) => {
  return arr.sort((a, b) => {
    if (!a.eventDate) return 1;
    if (!b.eventDate) return -1;
    return new Date(a.eventDate) - new Date(b.eventDate);
  });
};

// Transforms an event into an object with specific fields.
// includeMoney determines whether to include financial info.
// The exported column order is now:
// Client Name, Event Name, Event Date, Event Time, Building Area, Number of Guests,
// (money fields, if applicable), and finally Notes.
const formatEventForExport = (event, includeMoney) => {
  // Combine start and end time if available.
  const eventTime = event.startTime
    ? event.endTime
      ? `${event.startTime} - ${event.endTime}`
      : event.startTime
    : '';

  const base = {
    'Client Name': event.clientName || '',
    'Event Name': event.eventName || '',
    'Event Date': event.eventDate ? new Date(event.eventDate) : '',
    'Event Time': eventTime,
    'Building Area': event.buildingArea || '',
    'Number of Guests': event.numberOfGuests || ''
  };

  if (includeMoney) {
    base['Price Given'] = event.priceGiven || '';
    base['Down Payment Required'] = event.downPaymentRequired || '';
    base['Down Payment Received'] = event.downPaymentReceived ? 'Yes' : 'No';
    base['Amount Paid After'] = event.amountPaidAfter || '';
    base['Grand Total'] = event.grandTotal || '';
    base['Security Deposit'] = event.securityDeposit || '';
  }

  // Notes always at the end.
  base['Notes'] = event.notes || '';

  return base;
};

/**
 * Exports events to an Excel file with three sheets (Pending, Upcoming, Finished).
 * The filterOptions parameter now includes reportType:
 *   - "internal": export includes money info
 *   - "external": export excludes money info
 *
 * @param {Array} events - Array of event objects.
 * @param {Object} filterOptions - { reportType: string, finished: { exclude: boolean, start: string, end: string } }
 */
export const exportEventsToExcel = (events, filterOptions = {}) => {
  const includeMoney = filterOptions.reportType === 'internal';

  // Process Pending events: filter, sort, and format.
  const pending = sortByDate(
    events.filter(event => event.status === 'maybe')
  ).map(e => formatEventForExport(e, includeMoney));

  // Process Upcoming events: filter, sort, and format.
  const upcoming = sortByDate(
    events.filter(event => event.status === 'upcoming')
  ).map(e => formatEventForExport(e, includeMoney));

  // Process Finished events with optional filtering, then sort and format.
  let finishedEvents = events.filter(event => event.status === 'finished');
  const finishedFilter = filterOptions.finished || {};
  if (finishedFilter.exclude) {
    finishedEvents = [];
  } else if (finishedFilter.start || finishedFilter.end) {
    finishedEvents = finishedEvents.filter(event => {
      if (!event.eventDate) return false;
      const eventDate = new Date(event.eventDate);
      let valid = true;
      if (finishedFilter.start) {
        const [startYear, startMonth] = finishedFilter.start.split('-');
        const startDate = new Date(parseInt(startYear, 10), parseInt(startMonth, 10) - 1, 1);
        valid = valid && eventDate >= startDate;
      }
      if (finishedFilter.end) {
        const [endYear, endMonth] = finishedFilter.end.split('-');
        const endDate = new Date(parseInt(endYear, 10), parseInt(endMonth, 10), 0);
        valid = valid && eventDate <= endDate;
      }
      return valid;
    });
  }
  const finished = sortByDate(finishedEvents).map(e => formatEventForExport(e, includeMoney));

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Helper function to add a sheet to the workbook.
  const addSheet = (data, sheetName) => {
    if (!data.length) return; // Skip if there is no data
    const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: false });
    
    // Set column widths based on whether money info is included.
    let cols;
    if (includeMoney) {
      cols = [
        { wch: 20 }, // Client Name
        { wch: 20 }, // Event Name
        { wch: 15, z: 'yyyy-mm-dd' }, // Event Date
        { wch: 15 }, // Event Time
        { wch: 15 }, // Building Area
        { wch: 15 }, // Number of Guests
        { wch: 15 }, // Price Given
        { wch: 20 }, // Down Payment Required
        { wch: 20 }, // Down Payment Received
        { wch: 15 }, // Amount Paid After
        { wch: 15 }, // Grand Total
        { wch: 15 }, // Security Deposit
        { wch: 30 }  // Notes
      ];
    } else {
      cols = [
        { wch: 20 }, // Client Name
        { wch: 20 }, // Event Name
        { wch: 15, z: 'yyyy-mm-dd' }, // Event Date
        { wch: 15 }, // Event Time
        { wch: 15 }, // Building Area
        { wch: 15 }, // Number of Guests
        { wch: 30 }  // Notes
      ];
    }
    worksheet['!cols'] = cols;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  };

  addSheet(pending, "Pending");
  addSheet(upcoming, "Upcoming");
  addSheet(finished, "Finished");

  // Generate a filename that includes the report type and the current date.
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Events_Export_${filterOptions.reportType}_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
