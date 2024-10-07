'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import tippy from 'tippy.js'; // Import Tippy.js
import 'tippy.js/dist/tippy.css'; // Import Tippy.js styles
import { Flex } from "@chakra-ui/react";
import RefreshButton from "@/components/RefreshButton";
import Legend from '@/components/Legend';

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
    const startTime = eventInfo.event.allDay ? '09:00' : eventInfo.event.start.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  
    const endTime = eventInfo.event.allDay ? '18:00' : (eventInfo.event.end 
      ? eventInfo.event.end.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }) : "N/A");

    const instance = tippy(eventInfo.el, {
      content: `
        <strong>${eventInfo.event.title}</strong><br>
        Time: ${startTime} to ${endTime}<br>
      `,
      allowHTML: true,
      interactive: true,
      theme: 'light',
    });
  }

  const handleRefresh = () => {
    setEvents([]);
  };

  return (
    <div>
      <Flex justifyContent="space-between" alignItems="center">
      <Legend />
      <RefreshButton onClick={handleRefresh} />
      </Flex>
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
      height="calc(100vh - 250px)"
      slotMinTime="09:00:00"
      slotMaxTime="18:00:00"
    />
    </div>
  );
};

export default Calendar;
