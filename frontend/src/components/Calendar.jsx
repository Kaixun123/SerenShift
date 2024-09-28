'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import tippy from 'tippy.js'; // Import Tippy.js
import 'tippy.js/dist/tippy.css'; // Import Tippy.js styles

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
    <div className="legend horizontal-legend">
        <div className="legend-item">
            <span className="legend-color am-color"></span>
            <span>AM</span>
        </div>
        <div className="legend-item">
            <span className="legend-color pm-color"></span>
            <span>PM</span>
        </div>
        <div className="legend-item">
            <span className="legend-color full-day-color"></span>
            <span>Full Day</span>
        </div>
    </div>
);

  const eventsWithColors = events.map(event => {
    if (event.extendedProps.type === 'AM') {
      return { ...event, color: '#e4b91c' }; // Set color for AM events
    }
    if (event.extendedProps.type === 'PM') {
      return { ...event, color: '#3E9CE9' }; // Set color for PM events
    }
    if (event.extendedProps.type === 'Full Day') {
      return { ...event, color: '#41b671' }; // Set color for Full Day events
    }
    return event; // Return the event unmodified if no condition matches
  });

  const handleEventDidMount = (eventInfo) => {
    // Create a Tippy.js instance for each event element
    const options = {
      hour: '2-digit',
      minute: '2-digit',
    }
    const instance = tippy(eventInfo.el, {
      content: `
        <strong>${eventInfo.event.title}</strong><br>
        Time: ${eventInfo.event.start.toLocaleString(options).split(', ')[1].slice(0,5)}
        to ${eventInfo.event.end ? eventInfo.event.end.toLocaleString(options).split(', ')[1].slice(0,5) : 'N/A'}<br>
      `,
      allowHTML: true,
      interactive: true,
      theme: 'light',
    });
  }

  return (
    <div>
      <strong>Legend:</strong>
    <Legend/>
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
      initialView="dayGridMonth"
      events={eventsWithColors}
      eventDidMount={handleEventDidMount}
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,listMonth'
      }}  
    />
    </div>
  );
};

export default Calendar;
