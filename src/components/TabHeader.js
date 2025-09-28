import React from 'react';

function TabHeader({ icon, title, actions, className = '', titleClassName = '', as: HeadingTag = 'h1' }) {
  const containerClasses = [
    'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6',
    className
  ].filter(Boolean).join(' ');

  const headingClasses = [
    'text-2xl font-bold text-gray-800',
    titleClassName
  ].filter(Boolean).join(' ');

  const actionItems = Array.isArray(actions)
    ? actions.filter(Boolean)
    : actions
      ? [actions]
      : [];

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-3">
        {icon && <span className="flex items-center">{icon}</span>}
        <HeadingTag className={headingClasses}>{title}</HeadingTag>
      </div>
      {actionItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {actionItems.map((action, index) => (
            <div key={index} className="flex-shrink-0">
              {action}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TabHeader;
