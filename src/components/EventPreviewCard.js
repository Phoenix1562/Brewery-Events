import React from 'react';
import { DollarSign, Calendar } from 'lucide-react';

function EventPreviewCard({ event, onClick, highlight }) {
  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return 'No Date';
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check payment status
  const needsDownPayment = event.downPaymentRequired > 0 && !event.downPaymentReceived;
  const needsFinalPayment = event.grandTotal > 0 && !event.finalPaymentReceived;
  const hasPaymentIssue = needsDownPayment || needsFinalPayment;

  return (
    <div
      className={`laptop:p-2 p-3 bg-white rounded-lg shadow hover:shadow-md cursor-pointer transition 
      ${highlight ? 'border-l-4 border-blue-500' : ''} 
      ${hasPaymentIssue ? 'border-r-2 border-r-amber-400' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 truncate laptop:text-sm text-base">
          {event.clientName || 'No Client'}
        </h3>
        {hasPaymentIssue && (
          <span className="text-amber-500" title="Payment needed">
            <DollarSign size={16} className="laptop:w-4 laptop:h-4" />
          </span>
        )}
      </div>
      
      <p className="text-gray-600 laptop:text-xs text-sm truncate">
        {event.eventName || 'No Event Name'}
      </p>
      
      <div className="flex items-center justify-between mt-1 laptop:text-xs text-sm">
        <div className="flex items-center text-gray-500">
          <Calendar size={14} className="mr-1 laptop:w-3 laptop:h-3" />
          {formatDate(event.eventDate)}
        </div>
        
        {hasPaymentIssue && (
          <div className="text-amber-500 font-medium laptop:text-xs text-sm">
            {needsDownPayment ? 'Down payment due' : 'Final payment due'}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventPreviewCard;