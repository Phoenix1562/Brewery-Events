import * as XLSX from 'xlsx';

// Transform each event into only the desired fields with custom headers.
// Convert "Event Date" to a Date object for proper Excel formatting.
const formatEventForExport = (event) => ({
  'Client Name': event.clientName || '',
  'Event Name': event.eventName || '',
  'Event Date': event.eventDate ? new Date(event.eventDate) : '',
  'Building Area': event.buildingArea || '',
  'Price Given': event.priceGiven || '',
  'Down Payment Required': event.downPaymentRequired || '',
  'Down Payment Received': event.downPaymentReceived ? 'Yes' : 'No',
  'Amount Due After': event.amountDueAfter || '',
  'Amount Paid After': event.amountPaidAfter || '',
  'Grand Total': event.grandTotal || '',
  'Security Deposit': event.securityDeposit || '',
  'Notes': event.notes || ''
});

/**
 * Exports events to an Excel file with three sheets (Pending, Upcoming, Finished).
 * The finished events can be filtered via the filterOptions parameter.
 *
 * @param {Array} events - The full array of event objects.
 * @param {Object} filterOptions - Optional filter for finished events.
 *   { finished: { exclude: boolean, start: string, end: string } }
 *     - start and end are in "YYYY-MM" format.
 */
export const exportEventsToExcel = (events, filterOptions = {}) => {
  // Process Pending and Upcoming events (no filtering)
  const pending = events
    .filter(event => event.status === 'maybe')
    .map(formatEventForExport);
  const upcoming = events
    .filter(event => event.status === 'upcoming')
    .map(formatEventForExport);

  // Process Finished events with optional filtering
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
        // Convert finishedFilter.start (YYYY-MM) to a Date (first day of month)
        const [startYear, startMonth] = finishedFilter.start.split('-');
        const startDate = new Date(parseInt(startYear, 10), parseInt(startMonth, 10) - 1, 1);
        valid = valid && eventDate >= startDate;
      }
      if (finishedFilter.end) {
        // Convert finishedFilter.end (YYYY-MM) to a Date (last day of month)
        const [endYear, endMonth] = finishedFilter.end.split('-');
        // Day 0 of next month gives the last day of the current month.
        const endDate = new Date(parseInt(endYear, 10), parseInt(endMonth, 10), 0);
        valid = valid && eventDate <= endDate;
      }
      return valid;
    });
  }
  const finished = finishedEvents.map(formatEventForExport);

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Helper to convert JSON data to a worksheet, set column widths, freeze header, and add it to the workbook
  const addSheet = (data, sheetName) => {
    if (!data.length) return; // Skip empty sheets
    const worksheet = XLSX.utils.json_to_sheet(data, { skipHeader: false });
    
    // Set column widths and a number format for the date column (index 2)
    worksheet['!cols'] = [
      { wch: 20 }, // Client Name
      { wch: 20 }, // Event Name
      { wch: 15, z: 'yyyy-mm-dd' }, // Event Date, formatted as date
      { wch: 15 }, // Building Area
      { wch: 15 }, // Price Given
      { wch: 20 }, // Down Payment Required
      { wch: 20 }, // Down Payment Received
      { wch: 15 }, // Amount Due After
      { wch: 15 }, // Amount Paid After
      { wch: 15 }, // Grand Total
      { wch: 18 }, // Security Deposit
      { wch: 30 }  // Notes
    ];
    
    // Freeze the header row
    worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };
    
    // Remove auto-filter (sorting arrows) by not adding any autofilter property

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  };

  addSheet(pending, "Pending");
  addSheet(upcoming, "Upcoming");
  addSheet(finished, "Finished");

  // Generate a filename that includes the current date.
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Events_Export_${dateStr}.xlsx`);
};
