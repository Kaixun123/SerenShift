'use client';
import React, { useState, useEffect } from 'react';
import { Box, Heading, Text, Stack, Flex } from '@chakra-ui/react';
import TopHeader from "@/components/TopHeader";
import { Layout } from '@/components/Layout.jsx';
import { MultiSelect, Select } from '@mantine/core'; // Import Mantine's MultiSelect

const TeamSchedulePage = () => {
  const [loading, setLoading] = useState(false);
  const [colleagues, setColleagues] = useState([]);
  const [selectedColleagueIds, setSelectedColleagueIds] = useState([]);  // Multi-select state
  const [scheduleData, setScheduleData] = useState(null);

  // Fetch colleagues list and schedule concurrently
  const handleApiCalls = async (colleagueIds) => {
    setLoading(true);
    setScheduleData(null); // Clear previous schedule

    try {
      // Fetch colleagues list
      const colleaguesResponse = await fetch('/api/employee/colleagues', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const colleaguesData = await colleaguesResponse.json();

      // Pass selected colleague IDs as a query parameter
      const query = colleagueIds.length > 0 ? `?colleague_id=${colleagueIds.join(',')}` : '';
      const scheduleResponse = await fetch(`/api/schedule/teamschedule${query}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const scheduleData = await scheduleResponse.json();

      if (colleaguesResponse.ok && scheduleResponse.ok) {
        setColleagues(colleaguesData); // Set the colleague data to display in the multi-select dropdown
        setScheduleData(scheduleData); // Set the schedule data to display
        console.log('Colleagues API response:', colleaguesData);
        console.log('Schedule API response:', scheduleData);
      } else {
        console.error('API error occurred');
      }
    } catch (error) {
      console.error('Error calling API:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    handleApiCalls([]);
  }, []); // Empty dependency array ensures it runs only on mount

  // Handle colleague selection change
  const handleColleagueSelect = (selectedIds) => {
    setSelectedColleagueIds(selectedIds);  // Update the selection
    handleApiCalls(selectedIds);  // Trigger the API call with selected colleagues
  };

  return (
    <Layout>
      <Flex direction="column" flex="1" height="100vh">
        <TopHeader
          mainText={"View Your Team Schedule"}
          subText={"Viewing your colleagues' schedule!"}
        />

        {/* Main content (Schedule) */}
        <Box flex="1" p={4} overflow="hidden">
          {/* Align buttons to the right */}
          <Stack direction="row" spacing={4} mt={0}>
            {/* Multi-select for Colleagues using Mantine */}
            <MultiSelect
              data={colleagues.map((colleague) => ({
                value: String(colleague.user_id),  // Convert user_id to string
                label: `${colleague.first_name} ${colleague.last_name}`
              }))}
              placeholder="Select Colleagues"
              value={selectedColleagueIds.map(String)}  // Ensure selected IDs are strings
              onChange={handleColleagueSelect}  // Trigger selection change
              styles={{
                input: {
                  width: '300px',  // Fixed width for the input
                  height: '30px',  // Set the height for the input box
                  maxHeight: '30px',  // Set the maximum height for the input box
                  overflow: 'auto',  // Allow scrolling if content exceeds max height
                },
              }}
            />

            {/* Mantine Select for Month */}
            <Select
              placeholder="Select Month"
              data={[
                { value: 'January', label: 'January' },
                { value: 'February', label: 'February' },
                { value: 'March', label: 'March' },
                { value: 'April', label: 'April' },
                { value: 'May', label: 'May' },
                { value: 'June', label: 'June' },
                { value: 'July', label: 'July' },
                { value: 'August', label: 'August' },
                { value: 'September', label: 'September' },
                { value: 'October', label: 'October' },
                { value: 'November', label: 'November' },
                { value: 'December', label: 'December' }
              ]}
            />

            {/* Mantine Select for Year */}
            <Select
              placeholder="Select Year"
              data={[
                { value: '2022', label: '2022' },
                { value: '2023', label: '2023' },
                { value: '2024', label: '2024' }
              ]}
            />
          </Stack>

          {/* Scrollable team schedule */}
          {scheduleData && (
            <Box
              mt={4}
              borderRadius="md"
              h="calc(100vh - 220px)"  // Adjust the height to make space for other elements
              overflowY="auto"  // Use auto to avoid unnecessary scrollbars
              p={4}
              sx={{
                /* Hide the scrollbar for Webkit browsers (Chrome, Safari, etc.) */
                '::-webkit-scrollbar': {
                  display: 'none',
                },
                /* Hide scrollbar for Internet Explorer, Edge, and Firefox */
                '-ms-overflow-style': 'none',  // IE and Edge
                'scrollbar-width': 'none',     // Firefox
              }}
            >
              <Stack spacing={4}>
                {Object.entries(scheduleData).map(([date, schedule], index) => (
                  <Box key={index} borderWidth="1px" borderRadius="lg" p={4} mt={4}>
                    <Heading size="md" mb={2}>{date}</Heading>
                    {Object.entries(schedule).map(([timePeriod, colleagues], index) => (
                      <Box key={index} mt={2}>
                        <Heading size="sm">{timePeriod}</Heading>
                        <Text>{colleagues.join(', ')}</Text>
                      </Box>
                    ))}
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </Flex>
    </Layout>
  );
};

export default TeamSchedulePage;
