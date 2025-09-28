// ExportModal.js
import React, { useState } from 'react';

function ExportModal({ visible, onClose, onConfirm }) {
  const [configTab, setConfigTab] = useState('finished');

  const [finishedConfig, setFinishedConfig] = useState({
    applyDateRange: true,
    startDate: '',
    endDate: '',
  });
  const [upcomingConfig, setUpcomingConfig] = useState({
    applyDateRange: true,
    startDate: '',
    endDate: '',
  });

  const [includeFinishedSheet, setIncludeFinishedSheet] = useState(true);
  const [includeUpcomingSheet, setIncludeUpcomingSheet] = useState(true);

  if (!visible) return null;

  // Determine which config set is active based on the configTab
  const currentConfig = configTab === 'finished' ? finishedConfig : upcomingConfig;
  const setCurrentConfig = configTab === 'finished' ? setFinishedConfig : setUpcomingConfig;
  
  // Determine if the sheet for the currently active configTab is selected for export
  const isCurrentConfigSheetIncluded = configTab === 'finished' ? includeFinishedSheet : includeUpcomingSheet;

  const canExport = includeFinishedSheet || includeUpcomingSheet;

  const handleConfirm = (reportType) => {
    if (!canExport) return;

    const filterOptions = {
      reportType,
      exportSheets: {
        finished: includeFinishedSheet,
        upcoming: includeUpcomingSheet,
      },
      configurations: {
        finished: {
          applyDateRange: finishedConfig.applyDateRange,
          startDate: finishedConfig.applyDateRange ? finishedConfig.startDate : '',
          endDate: finishedConfig.applyDateRange ? finishedConfig.endDate : '',
        },
        upcoming: {
          applyDateRange: upcomingConfig.applyDateRange,
          startDate: upcomingConfig.applyDateRange ? upcomingConfig.startDate : '',
          endDate: upcomingConfig.applyDateRange ? upcomingConfig.endDate : '',
        },
      },
    };
    onConfirm(filterOptions);
    onClose();
  };

  const TabButton = ({ tabName, label }) => (
    <button
      onClick={() => setConfigTab(tabName)}
      className={`px-4 py-2.5 text-sm font-medium rounded-t-lg focus:outline-none transition-colors duration-150 border-b-2
        ${configTab === tabName
          ? 'border-blue-600 text-blue-600 bg-white'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-gray-50'
        }
      `}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-50 p-6 rounded-lg shadow-xl w-full max-w-lg transform transition-all flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">Configure Export Options</h2>

        <div className="mb-4 p-3 bg-white rounded-md shadow-sm border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Sheets to Include in Export:</h4>
          <div className="space-y-2">
            <label htmlFor="includeFinishedToggle" className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="includeFinishedToggle"
                checked={includeFinishedSheet}
                onChange={(e) => setIncludeFinishedSheet(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Finished Events Sheet</span>
            </label>
            <label htmlFor="includeUpcomingToggle" className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="includeUpcomingToggle"
                checked={includeUpcomingSheet}
                onChange={(e) => setIncludeUpcomingSheet(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Upcoming Events Sheet</span>
            </label>
          </div>
           {!canExport && <p className="text-xs text-red-500 mt-2">Please select at least one sheet to export.</p>}
        </div>

        <div className="flex border-b border-gray-300">
          <TabButton tabName="finished" label="Finished Events Filters" />
          <TabButton tabName="upcoming" label="Upcoming Events Filters" />
        </div>

        <div className="py-5 px-1 flex-grow overflow-y-auto min-h-[150px]"> {/* Added min-h for consistent height */}
          {isCurrentConfigSheetIncluded ? (
            <>
              <h3 className="text-md font-medium text-gray-700 mb-1">
                Date filtering for <span className="font-semibold text-blue-600">{configTab === 'finished' ? 'Finished' : 'Upcoming'}</span> events:
              </h3>
              
              <div className="mb-3 mt-3">
                <label htmlFor={`applyDateRangeToggle-${configTab}`} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id={`applyDateRangeToggle-${configTab}`}
                    checked={currentConfig.applyDateRange}
                    onChange={(e) => setCurrentConfig(prev => ({ ...prev, applyDateRange: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Filter by specific date range</span>
                </label>
              </div>

              {currentConfig.applyDateRange ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-1 animate-fadeIn">
                  <div>
                    <label htmlFor={`exportStartDate-${configTab}`} className="block text-sm font-medium text-gray-700 mb-1">Start Date:</label>
                    <input
                      type="date"
                      id={`exportStartDate-${configTab}`}
                      value={currentConfig.startDate}
                      onChange={(e) => setCurrentConfig(prev => ({ ...prev, startDate: e.target.value }))}
                      className="border border-gray-300 p-2 w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor={`exportEndDate-${configTab}`} className="block text-sm font-medium text-gray-700 mb-1">End Date:</label>
                    <input
                      type="date"
                      id={`exportEndDate-${configTab}`}
                      value={currentConfig.endDate}
                      onChange={(e) => setCurrentConfig(prev => ({ ...prev, endDate: e.target.value }))}
                      className="border border-gray-300 p-2 w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 sm:col-span-2">
                     (Leave a date blank for an open-ended range)
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-1 mb-1 ml-1 animate-fadeIn">
                  All {configTab} events in this sheet will be included, regardless of date.
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-10 px-4">
                <p className="text-sm text-gray-500">
                    The <span className="font-semibold">{configTab}</span> events sheet is not currently selected for export.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    You can enable it using the checkboxes under "Sheets to Include in Export" above.
                </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-300 pt-5 mt-auto">
          <p className="text-sm text-gray-600 mb-3 text-center">Choose report type (will generate selected sheets):</p>
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => handleConfirm("external")}
              disabled={!canExport}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              External Report
              <span className="block text-xs opacity-80">(No financial details)</span>
            </button>
            <button
              onClick={() => handleConfirm("internal")}
              disabled={!canExport}
              className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Internal Report
              <span className="block text-xs opacity-80">(Includes financial details)</span>
            </button>
          </div>
          <div className="mt-5 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportModal;