import React from 'react';
import { DollarSign, Calendar, ClipboardList, User2 } from 'lucide-react';

function EventPreviewCard({ event, onClick, highlight }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'No Date';
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatWeekday = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const formatCurrency = (value) => {
    if (!value || Number.isNaN(Number(value))) return null;
    const numberValue = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(numberValue)) return null;
    return numberValue.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });
  };

  const needsDownPayment = event.downPaymentRequired > 0 && !event.downPaymentReceived;
  const needsFinalPayment = event.grandTotal > 0 && !event.finalPaymentReceived;
  const hasPaymentIssue = needsDownPayment || needsFinalPayment;
  const paymentLabel = needsDownPayment
    ? 'Down payment due'
    : needsFinalPayment
      ? 'Final payment due'
      : null;

  const chipColor = 'bg-indigo-500/10 text-indigo-600';

  const formattedTotal = formatCurrency(event.grandTotal || event.priceGiven);
  const highlightStyles = highlight
    ? `${hasPaymentIssue ? '' : 'border-indigo-200'} bg-indigo-50/40 shadow-md`
    : '';

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-0.5
        ${highlightStyles}
        ${hasPaymentIssue ? 'border-rose-200' : ''}`}
      onClick={onClick}
    >
      <div className="p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {event.clientName || 'No Client'}
            </p>
            <p className="flex items-center gap-1 text-xs text-slate-500 truncate">
              <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
              {event.eventName || 'No Event Name'}
            </p>
          </div>

          <div className={`hidden sm:flex items-center gap-2 text-xs font-medium ${chipColor} px-3 py-1 rounded-full whitespace-nowrap`}>
            {event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : 'Event'}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 text-xs text-slate-500 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-900/5 px-3 py-2">
            <Calendar className="h-4 w-4 text-indigo-500" />
            <div>
              <p className="font-medium text-slate-800">{formatDate(event.eventDate)}</p>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{formatWeekday(event.eventDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-900/5 px-3 py-2">
            <User2 className="h-4 w-4 text-indigo-500" />
            <div className="truncate">
              <p className="font-medium text-slate-800 truncate">{event.buildingArea || 'To be determined'}</p>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Space</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-900/5 px-3 py-2">
            <DollarSign className="h-4 w-4 text-indigo-500" />
            <div>
              <p className="font-medium text-slate-800">{formattedTotal || 'Not set'}</p>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Total</p>
            </div>
          </div>
        </div>

        {hasPaymentIssue && paymentLabel && (
          <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
            <div className="flex items-center gap-2 font-medium">
              <DollarSign className="h-3.5 w-3.5" />
              {paymentLabel}
            </div>
            <span className="font-semibold">Action needed</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventPreviewCard;
