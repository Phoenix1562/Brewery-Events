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
      className={`laptop:p-2 p-3 rounded-xl border border-surface-600 bg-surface-800 text-surface-100 shadow-sm transition-colors cursor-pointer hover:border-accent-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900 ${highlight ? 'ring-2 ring-accent-400 ring-offset-2 ring-offset-surface-900' : ''} ${hasPaymentIssue ? 'border-l-4 border-amber-400/80 laptop:pl-1.5 pl-2' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-surface-50 truncate laptop:text-sm text-base">
          {event.clientName || 'No Client'}
        </h3>
        {hasPaymentIssue && (
          <span className="text-amber-300" title="Payment needed">
            <DollarSign size={16} className="laptop:w-4 laptop:h-4" />
          </span>
        )}
      </div>

      <p className="text-surface-200 laptop:text-xs text-sm truncate">
        {event.eventName || 'No Event Name'}
      </p>

      <div className="flex items-center justify-between mt-1 laptop:text-xs text-sm">
        <div className="flex items-center text-surface-200">
          <Calendar size={14} className="mr-1 laptop:w-3 laptop:h-3 text-accent-200" />
          {formatDate(event.eventDate)}
        </div>

        {hasPaymentIssue && (
          <div className="text-amber-200 font-medium laptop:text-xs text-sm">
            {needsDownPayment ? 'Down payment due' : 'Final payment due'}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventPreviewCard;