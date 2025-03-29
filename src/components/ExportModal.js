import React, { useState } from 'react';

function ExportModal({ visible, onClose, onConfirm }) {
  // State for filtering options
  const [excludeFinished, setExcludeFinished] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  if (!visible) return null; // Render nothing if modal isn't visible

  const handleConfirm = () => {
    // Construct filter options object
    const filterOptions = {
      finished: {
        exclude: excludeFinished,
        start: startDate, // Expected in "YYYY-MM" format
        end: endDate      // Expected in "YYYY-MM" format
      }
    };
    // Pass the filter options back to the parent component
    onConfirm(filterOptions);
    // Close the modal
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose} // Close modal on backdrop click
    >
      <div 
        className="bg-white p-6 rounded shadow-md w-96" 
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <h2 className="text-xl font-bold mb-4">Export Options</h2>
        
        <div className="mb-4">
          <label className="block mb-1">Start Date (YYYY-MM):</label>
          <input
            type="month"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">End Date (YYYY-MM):</label>
          <input
            type="month"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="excludeFinished"
            checked={excludeFinished}
            onChange={(e) => setExcludeFinished(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="excludeFinished">Exclude Finished Events</label>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportModal;
