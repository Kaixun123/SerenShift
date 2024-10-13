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
import RefreshButton from "@/components/RefreshButton";
import "@/components/Calendar.css";

const SubordinateSchedulePage = () => {
  const [loading, setLoading] = useState(false);
  const [colleagues, setColleagues] = useState([]); // Holds subordinate data
  const [selectedColleagueIds, setSelectedColleagueIds] = useState([]);
  const [scheduleData, setScheduleData] = useState(null);
  const [employee, setEmployee] = useState({ department: "" });

  // For refresh functionality
  const [isRefresh, setRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleApiCalls = async (colleagueIds = []) => {
    setLoading(true);
    setScheduleData(null);

    try {
      const colleaguesResponse = await fetch("/api/employee/subordinates");
      const colleaguesData = await colleaguesResponse.json();

      const query =
        colleagueIds.length > 0
          ? `?colleague_id=${colleagueIds.join(",")}`
          : "";
      const scheduleResponse = await fetch(
        `/api/schedule/subordinateSchedule${query}`
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
    handleApiCalls([]); // Fetch data on mount or refresh
  }, [isRefresh]);

  const handleColleagueSelect = (selectedIds) => {
    setSelectedColleagueIds(selectedIds);
    handleApiCalls(selectedIds); // Update schedules based on selected colleague IDs
  };

  const handleRefresh = () => {
    // Trigger re-fetching of data with a slight delay for the refreshing effect
    setRefreshing(true);
    setTimeout(() => {
      setRefresh(true);
      setRefreshing(false);
      setSelectedColleagueIds([]); // Reset colleague selection
    }, 200);
    setRefresh(false); // Reset refresh state
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
        title={eventInfo.event.title}
      >
        {eventInfo.event.title}
      </div>
    );
  };

  const eventPropGetter = (event) => {
    let backgroundColor;
    if (event.extendedProps.timePeriod === "Full Day") {
      backgroundColor = "#4CAF50"; // Green
    } else if (event.extendedProps.timePeriod === "AM") {
      backgroundColor = "#F4C542"; // Yellow
    } else if (event.extendedProps.timePeriod === "PM") {
      backgroundColor = "#4DA1FF"; // Blue
    }

    return {
      style: {
        backgroundColor,
        color: "#fff",
        borderRadius: "4px",
        padding: "3px",
        height: "100%",
        width: "100%",
        border: "none",
        boxShadow: "none",
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
              <RefreshButton onClick={handleRefresh} isLoading={refreshing} />
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
              eventPropGetter={eventPropGetter}
              eventContent={eventContent}
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

export default SubordinateSchedulePage;
