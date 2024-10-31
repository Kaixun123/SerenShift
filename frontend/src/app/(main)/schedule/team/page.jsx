"use client";
import React, { useState, useEffect } from "react";
import { Box, Stack, Flex, Text, useToast } from "@chakra-ui/react";
import TopHeader from "@/components/TopHeader";
import { MultiSelect } from "@mantine/core";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import tippy from "tippy.js"; // Import Tippy.js
import "tippy.js/dist/tippy.css"; // Import Tippy.js styles
import RefreshButton from "@/components/RefreshButton";
import "@/components/Calendar.css";

const ColleagueSchedulePage = () => {
  const [loading, setLoading] = useState(false);
  const [colleagues, setColleagues] = useState([]);
  const [selectedColleagueIds, setSelectedColleagueIds] = useState([]);
  const [scheduleData, setScheduleData] = useState(null);
  const [employee, setEmployee] = useState({ department: "" });

  const [isRefresh, setRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function fetchEmployeeData() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        setEmployee({ department: `${data.department}` });
      } catch (error) {
        console.error("Error fetching employee data:", error);
      }
    }
    fetchEmployeeData();
  }, [isRefresh]);

  const handleApiCalls = async (colleagueIds = []) => {
    setLoading(true);
    setScheduleData(null);

    try {
      const colleaguesResponse = await fetch("/api/employee/colleagues");
      const colleaguesData = await colleaguesResponse.json();

      const query = colleagueIds.length > 0 ? `?colleague_id=${colleagueIds.join(",")}` : "";
      const scheduleResponse = await fetch(`/api/schedule/teamSchedule${query}`);
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
    handleApiCalls([]); // Fetch data on mount or refresh
  }, [isRefresh]);

  const handleColleagueSelect = (selectedIds) => {
    setSelectedColleagueIds(selectedIds);
    handleApiCalls(selectedIds); // Update schedules based on selected colleague IDs
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefresh(true);
      setSelectedColleagueIds([]); // Reset colleague selection
      handleApiCalls([]); // Fetch all colleagues' schedules
      setRefreshing(false);
    }, 200);
    setRefresh(false);
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
      ribbonColor = "#4CAF50"; // Green
    } else if (eventInfo.event.extendedProps.timePeriod === "AM") {
      ribbonColor = "#F4C542"; // Yellow
    } else if (eventInfo.event.extendedProps.timePeriod === "PM") {
      ribbonColor = "#4DA1FF"; // Blue
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

  const eventDidMount = (info) => {
    const timePeriod = info.event.extendedProps.timePeriod;
    const startTime = info.event.start
      ? info.event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "N/A";
    const endTime = info.event.end
      ? info.event.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "N/A";

    // Tooltip content
    const tooltipContent = `
      <strong>${info.event.title}</strong><br>
      Time: ${startTime} - ${endTime} (${timePeriod})
    `;

    // Initialize tippy tooltip
    tippy(info.el, {
      content: tooltipContent,
      allowHTML: true,
      interactive: true,
      theme: "light",
      delay: [200, 0],
    });
  };

  // Legend component
  const Legend = () => (
    <Box mb={4}>
      <Text fontSize="lg" fontWeight="bold">Legend:</Text>
      <Flex direction="row" align="center">
        <Box w="20px" h="20px" bg="#4CAF50" mr={2} />
        <Text mr={4}>Full Day</Text>
        <Box w="20px" h="20px" bg="#F4C542" mr={2} />
        <Text mr={4}>AM</Text>
        <Box w="20px" h="20px" bg="#4DA1FF" mr={2} />
        <Text>PM</Text>
      </Flex>
    </Box>
  );

  return (
    <main>
      <style>{`
        /* Remove the dot in the list view of FullCalendar */
        .fc-list-event-dot {
          display: none !important;
        }
      `}</style>
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
                placeholder={
                  selectedColleagueIds.length === 0 ? "Select Colleague" : ""
                }
                value={selectedColleagueIds.map(String)}
                onChange={handleColleagueSelect}
                clearable
                styles={{
                  input: {
                    width: "304px",
                    height: "30px",
                    maxHeight: "30px",
                    overflowY: "auto",
                  },
                }}
              />
              <RefreshButton isRefresh={handleRefresh} isLoading={refreshing} />
            </Stack>
          </Flex>

          <Box height="calc(68vh)">
            <FullCalendar
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                interactionPlugin,
                listPlugin,
              ]}
              initialView="dayGridMonth"
              events={events}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,listWeek",
              }}
              editable={false}
              selectable={true}
              nowIndicator={true}
              eventContent={eventContent}
              eventDidMount={eventDidMount}
              dayMaxEventRows={2}
              height="100%"
              slotMinTime="09:00:00"
              slotMaxTime="18:00:00"
              allDaySlot={false}
            />
          </Box>
        </Box>
      </Flex>
    </main>
  );
};

export default ColleagueSchedulePage;
