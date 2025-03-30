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
const formatEventForExport = (event, includeMoney) => {
  const base = {
    'Client Name': event.clientName || '',
    'Event Name': event.eventName || '',
    'Event Date': event.eventDate ? new Date(event.eventDate) : '',
    'Building Area': event.buildingArea || '',
    'Notes': event.notes || ''
  };

  if (includeMoney) {
    base['Price Given'] = event.priceGiven || '';
    base['Down Payment Required'] = event.downPaymentRequired || '';
    base['Down Payment Received'] = event.downPaymentReceived ? 'Yes' : 'No';
    base['Amount Due After'] = event.amountDueAfter || '';
    base['Amount Paid After'] = event.amountPaidAfter || '';
    base['Grand Total'] = event.grandTotal || '';
    base['Security Deposit'] = event.securityDeposit || '';
  }

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
    
    // Optionally, adjust column widths here.
    worksheet['!cols'] = [
      { wch: 20 }, // Client Name
      { wch: 20 }, // Event Name
      { wch: 15, z: 'yyyy-mm-dd' }, // Event Date
      { wch: 15 }, // Building Area
      { wch: 30 }  // Notes (or extra columns if money info is included)
    ];
    
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
