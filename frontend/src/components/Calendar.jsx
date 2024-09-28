'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const Calendar = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Fetch the schedule data from the backend
    const fetchSchedule = async () => {
      try {
        const response = await fetch('/api/schedule/ownSchedule'); 
        const data = await response.json();
        setEvents(data); 
      } catch (error) {
        console.error("Error fetching schedule:", error);
      }
    };

    fetchSchedule();
  }, []);

  const Legend = () => (
    <div className="legend">
      <div className="legend-item">
        <span className="legend-color meeting-color"></span>
        <span>Meeting</span>
      </div>
      <div className="legend-item">
        <span className="legend-color workshop-color"></span>
        <span>Workshop</span>
      </div>
    </div>
  );

  return (
    <div>
    <Legend/>
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={events}
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek'
      }}
      eventClassNames={(eventInfo) => {
        // Apply different classes based on event type or properties
        if (eventInfo.event.extendedProps.type === 'AM') {
          return 'am-event'; // Add a custom class to 'meeting' type events
        }
        return ''; // Default class for other events
      }}
      
    />
    </div>
  );
};

export default Calendar;
