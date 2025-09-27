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

  const getInitials = (value) => {
    if (!value) return 'EV';
    const parts = value.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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

  const chipColor =
    event.status === 'finished'
      ? 'bg-emerald-100 text-emerald-700'
      : event.status === 'upcoming'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-amber-100 text-amber-700';

  const formattedTotal = formatCurrency(event.grandTotal || event.priceGiven);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-gray-200 bg-white/80 backdrop-blur transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5
        ${highlight ? 'ring-2 ring-offset-2 ring-[#FF5A5F]' : ''}
        ${hasPaymentIssue ? 'border-amber-200' : ''}`}
      onClick={onClick}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF5A5F]/15 to-orange-200/40 text-[#FF5A5F] font-semibold">
              {getInitials(event.clientName || event.eventName)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {event.clientName || 'No Client'}
              </p>
              <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                <ClipboardList className="h-3.5 w-3.5 text-gray-400" />
                {event.eventName || 'No Event Name'}
              </p>
            </div>
          </div>

          <div className={`hidden sm:flex items-center gap-2 text-xs font-medium ${chipColor} px-3 py-1 rounded-full whitespace-nowrap`}>
            {event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : 'Event'}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 text-xs text-gray-500 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
            <Calendar className="h-4 w-4 text-[#FF5A5F]" />
            <div>
              <p className="font-medium text-gray-700">{formatDate(event.eventDate)}</p>
              <p className="text-[11px] uppercase tracking-wide">{formatWeekday(event.eventDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
            <User2 className="h-4 w-4 text-[#FF5A5F]" />
            <div className="truncate">
              <p className="font-medium text-gray-700 truncate">{event.buildingArea || 'To be determined'}</p>
              <p className="text-[11px] uppercase tracking-wide">Space</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
            <DollarSign className="h-4 w-4 text-[#FF5A5F]" />
            <div>
              <p className="font-medium text-gray-700">{formattedTotal || 'Not set'}</p>
              <p className="text-[11px] uppercase tracking-wide">Total</p>
            </div>
          </div>
        </div>

        {hasPaymentIssue && paymentLabel && (
          <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
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