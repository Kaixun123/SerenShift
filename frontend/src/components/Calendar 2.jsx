'use client'; // This must be at the top of the file
import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid'; // Keep this for week view
import './Calendar.css';

const Calendar = () => {
  return (
    // <div className="flex-grow flex items-center justify-center">
    <div>
      <FullCalendar
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
        ]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek', // Include both views
        }}
        initialView="dayGridMonth" // Default to month view
        nowIndicator={true}
        editable={true}
        selectable={true}
        selectMirror={true}
        initialEvents={[
          { title: 'nice event', start: new Date() },
        ]}
      />
    </div>
  );
};

export default Calendar;
