"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import { Flex, useToast } from "@chakra-ui/react"; // Import useToast from Chakra UI
import RefreshButton from "@/components/RefreshButton";
import Legend from "@/components/Legend";

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [isRefresh, setRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast(); // Initialize toast

  useEffect(() => {
    // Fetch the schedule data from the backend
    const fetchSchedule = async () => {
      try {
        const response = await fetch("/api/schedule/ownSchedule");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch schedule");
        }
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        toast.error(error.message);
      }
    };

    fetchSchedule();
  }, [isRefresh]);

  const eventsWithLabels = (eventInfo) => {
  // Determine the background colour based on the event type
  let ribbonColor;
  if (eventInfo.event.extendedProps.type === "Full Day") {
    ribbonColor = "#41b671"; // Green for Full Day
  } else if (eventInfo.event.extendedProps.type === "AM") {
    ribbonColor = "#e4b91c"; // Yellow for AM
  } else if (eventInfo.event.extendedProps.type === "PM") {
    ribbonColor = "#3E9CE9"; // Blue for PM
  }

  return (
    <div
      style={{
        backgroundColor: ribbonColor,
        color: "#fff",
        padding: "3px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {eventInfo.event.title}
    </div>
  );
};

  const handleEventDidMount = (eventInfo) => {
    const startTime = eventInfo.event.allDay
      ? "09:00"
      : eventInfo.event.start.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

    const endTime = eventInfo.event.allDay
      ? "18:00"
      : eventInfo.event.end
      ? eventInfo.event.end.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

    tippy(eventInfo.el, {
      content: `
        <strong>${eventInfo.event.title}</strong><br>
        Time: ${startTime} to ${endTime}<br>
      `,
      allowHTML: true,
      interactive: true,
      theme: "light",
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefresh(true);
      setEvents([]);
      setRefreshing(false);
    }, 200);
    setRefresh(false);
  };

  return (
    <div>
      <Flex justifyContent="space-between" alignItems="center">
        <Legend />
        <RefreshButton isRefresh={handleRefresh} isLoading={refreshing} />
      </Flex>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventContent={eventsWithLabels}
        eventDidMount={handleEventDidMount}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,listMonth",
        }}
        height="calc(100vh - 250px)"
        slotMinTime="09:00:00"
        slotMaxTime="18:00:00"
        displayEventTime={false}
      />
    </div>
  );
};

export default Calendar;
