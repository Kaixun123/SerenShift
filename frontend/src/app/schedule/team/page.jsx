'use client';
import React, { useState } from 'react';
import { Button, Spinner, Box, Select, Heading, Text, Stack } from '@chakra-ui/react';

const TeamSchedulePage = () => {
  const [loading, setLoading] = useState(false);
  const [colleagues, setColleagues] = useState([]);
  const [scheduleData, setScheduleData] = useState(null);

  // Fetch colleagues list and schedule concurrently
  const handleApiCalls = async () => {
    setLoading(true);
    setColleagues([]);
    setScheduleData(null); // Clear previous schedule

    try {
      // Using Promise.all to fetch colleagues and schedule at the same time
      const [colleaguesResponse, scheduleResponse] = await Promise.all([
        fetch('/api/employee/colleagues', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        fetch('/api/schedule/teamschedule', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      ]);

      const colleaguesData = await colleaguesResponse.json();
      const scheduleData = await scheduleResponse.json();

      if (colleaguesResponse.ok && scheduleResponse.ok) {
        setColleagues(colleaguesData); // Set the colleague data to display in the dropdown
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

  const renderSchedule = () => {
    if (!scheduleData) return null;

    return Object.entries(scheduleData).map(([date, schedule], index) => (
      <Box key={index} borderWidth="1px" borderRadius="lg" p={4} mt={4}>
        <Heading size="md" mb={2}>
          {date}
        </Heading>
        {Object.entries(schedule).map(([timePeriod, colleagues], index) => (
          <Box key={index} mt={2}>
            <Heading size="sm">{timePeriod}</Heading>
            <Text>{colleagues.join(', ')}</Text>
          </Box>
        ))}
      </Box>
    ));
  };

  return (
    <Box>
      {/* Button to show colleagues and schedule */}
      <Button
        colorScheme="blue"
        onClick={handleApiCalls}
        isLoading={loading}
        spinner={<Spinner size="sm" />}
        loadingText="Loading Colleagues & Schedule..."
      >
        Show Colleagues & Schedule
      </Button>

      {/* Dropdown to select colleague */}
      {colleagues.length > 0 && (
        <Select placeholder="Select a colleague" mt={4} multiple>
          {colleagues.map((colleague, index) => (
            <option key={index} value={colleague.first_name + ' ' + colleague.last_name}>
              {colleague.first_name} {colleague.last_name}
            </option>
          ))}
        </Select>
      )}

      {/* Display team schedule */}
      {scheduleData && (
        <Stack spacing={4} mt={4}>
          {renderSchedule()}
        </Stack>
      )}
    </Box>
  );
};

export default TeamSchedulePage;
