"use client";
import React, { useState, useEffect } from "react";
import { Box, Stack, Flex, Text } from "@chakra-ui/react";
import TopHeader from "@/components/TopHeader";
import { MultiSelect } from "@mantine/core";
import FullCalendar from "@fullcalendar/react"; // Import FullCalendar
import dayGridPlugin from "@fullcalendar/daygrid"; // Month view
import timeGridPlugin from "@fullcalendar/timegrid"; // Week view
import interactionPlugin from "@fullcalendar/interaction"; // For interactivity
import listPlugin from "@fullcalendar/list"; // List view plugin
import "@/components/Calendar.css";

const TeamSchedulePage = () => {
  const [loading, setLoading] = useState(false);
  const [colleagues, setColleagues] = useState([]);
  const [selectedColleagueIds, setSelectedColleagueIds] = useState([]);
  const [scheduleData, setScheduleData] = useState(null);
  const [employee, setEmployee] = useState({ department: "" });
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    async function fetchEmployeeData() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        setEmployee({
          department: `${data.department}`,
        });
      } catch (error) {
        console.error("Error fetching employee data:", error);
      }
    }
    fetchEmployeeData();
  }, []);

  const handleApiCalls = async (colleagueIds) => {
    setLoading(true);
    setScheduleData(null);

    try {
      const colleaguesResponse = await fetch("/api/employee/colleagues");
      const colleaguesData = await colleaguesResponse.json();

      const query =
        colleagueIds.length > 0
          ? `?colleague_id=${colleagueIds.join(",")}`
          : "";
      const scheduleResponse = await fetch(
        `/api/schedule/teamschedule${query}`
      );
      const scheduleData = await scheduleResponse.json();

      if (colleaguesResponse.ok && scheduleResponse.ok) {
        setColleagues(colleaguesData);
        setScheduleData(scheduleData);
      } else {
        console.error("API error occurred");
      }
    } catch (error) {
      console.error("Error calling API:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleApiCalls([]);
  }, []);

  const handleColleagueSelect = (selectedIds) => {
    setSelectedColleagueIds(selectedIds);
    handleApiCalls(selectedIds);
  };

  // Convert scheduleData into a format suitable for FullCalendar
  const events = scheduleData
    ? Object.entries(scheduleData).flatMap(([date, schedule]) =>
      Object.entries(schedule).flatMap(([timePeriod, colleagues]) =>
        colleagues.map((colleague) => {
          const eventDate = new Date(date);
          let start, end;

          if (timePeriod === "Full Day") {
            start = new Date(eventDate.setHours(9, 0, 0));
            end = new Date(eventDate.setHours(18, 0, 0));
          } else if (timePeriod === "AM") {
            start = new Date(eventDate.setHours(9, 0, 0));
            end = new Date(eventDate.setHours(13, 0, 0));
          } else if (timePeriod === "PM") {
            start = new Date(eventDate.setHours(14, 0, 0));
            end = new Date(eventDate.setHours(18, 0, 0));
          }

          return {
            title: `${colleague}`,
            start,
            end,
            allDay: false,
            timePeriod,
          };
        })
      )
    )
    : [];

  const eventContent = (eventInfo) => {
    let ribbonColor;
    if (eventInfo.event.extendedProps.timePeriod === "Full Day") {
      ribbonColor = "#e3826f";
    } else if (eventInfo.event.extendedProps.timePeriod === "AM") {
      ribbonColor = "#efba98";
    } else if (eventInfo.event.extendedProps.timePeriod === "PM") {
      ribbonColor = "#e7d5c7";
    }

    return (
      <div
        style={{
          backgroundColor: ribbonColor,
          color: "#fff",
          padding: "3px 8px",
          borderRadius: "4px",
          fontSize: "12px",
          width: "100%", // Ensure the content spans the full width
          height: "100%", // Ensure the content spans the full height
          boxSizing: "border-box", // Include padding in element's total width/height
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={eventInfo.event.title} // Show full text on hover
      >
        {eventInfo.event.title}
      </div>
    );
  };

  const eventPropGetter = (event) => {
    let backgroundColor;
    if (event.extendedProps.timePeriod === "Full Day") {
      backgroundColor = "#e3826f";
    } else if (event.extendedProps.timePeriod === "AM") {
      backgroundColor = "#efba98";
    } else if (event.extendedProps.timePeriod === "PM") {
      backgroundColor = "#e7d5c7";
    }

    return {
      style: {
        backgroundColor: backgroundColor,
        color: "#fff",
        borderRadius: "4px",
        padding: "3px",
        height: "100%", // Ensure the event fills the whole box vertically
        width: "100%", // Ensure the event fills the whole box horizontally
        border: "none", // Remove the border
        boxShadow: "none", // Remove any shadow or outline
      },
    };
  };

  // Legend component
  const Legend = () => (
    <Box mb={4}>
      <Text fontSize="lg" fontWeight="bold">
        Legend:
      </Text>
      <Flex direction="row" align="center">
        <Box w="20px" h="20px" bg="#e3826f" mr={2} />
        <Text mr={4}>Full Day</Text>
        <Box w="20px" h="20px" bg="#efba98" mr={2} />
        <Text mr={4}>AM</Text>
        <Box w="20px" h="20px" bg="#e7d5c7" mr={2} />
        <Text>PM</Text>
      </Flex>
    </Box>
  );

  return (
    <main>
      <Flex direction="column" flex="1" height="100vh">
        <Box position="relative" zIndex="2">
          <TopHeader
            mainText={`${employee.department} Department Schedule`}
            subText={"Viewing your team's schedule"}
          />
        </Box>
        <Box flex="1" p={4}>
          <Flex justifyContent="space-between" alignItems="center">
            <Legend />
            <Stack direction="row">
              <MultiSelect
                data={colleagues
                  .sort((a, b) => a.first_name.localeCompare(b.first_name))
                  .map((colleague) => ({
                    value: String(colleague.user_id),
                    label: `${colleague.first_name} ${colleague.last_name}`,
                  }))}
                placeholder="Select Colleagues"
                value={selectedColleagueIds.map(String)}
                onChange={handleColleagueSelect}
                styles={{
                  input: {
                    width: "304px",
                    height: "30px",
                    maxHeight: "30px",
                  },
                }}
              />
            </Stack>
          </Flex>

          <Box height="calc(68vh)">
            <style>{`
    /* Remove background color for events in the list view */
    .fc-view-list .fc-list-event {
      background-color: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }
    
    /* Ensure event title and time retain appropriate colors in the list view */
    .fc-view-list .fc-list-event-title,
    .fc-view-list .fc-list-event-time {
      color: #000 !important;
    }
  `}</style>

            <FullCalendar
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                interactionPlugin,
                listPlugin,
              ]}
              initialView="timeGridWeek" // Start with week view or any other view
              events={events}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,listWeek",
              }}
              editable={false}
              selectable={true}
              nowIndicator={true}
              eventPropGetter={eventPropGetter} // Custom logic for events
              dateClick={(info) => console.log("Date clicked:", info.dateStr)}
              eventClick={(info) => console.log("Event clicked:", info.event)}
              eventContent={eventContent} // Custom content for the events
              dayMaxEventRows={2} // Limit the number of visible events to 3 rows
              height="100%"
              slotMinTime="09:00:00" // Start time at 9 AM
              slotMaxTime="18:00:00" // End time at 6 PM
              allDaySlot={false}
            />
          </Box>
        </Box>
      </Flex>
    </main>
  );
};

export default TeamSchedulePage;
