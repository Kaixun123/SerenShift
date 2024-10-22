'use client';
import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Group, Container, Text, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { Flex, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Box, Spinner } from '@chakra-ui/react'; // Import Spinner
import 'chart.js/auto';
import TopHeader from "@/components/TopHeader";

const statsPage = () => {
  const [date, setDate] = useState(new Date()); // Default to today's date
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDeptData, setSelectedDeptData] = useState(null); // Store department-specific WFH stats
  const [wfhStaff, setWfhStaff] = useState([]); // Store WFH staff data

  // Fetch data from backend
  const fetchStats = async (selectedDate) => {
    setLoading(true);
    const formattedDate = selectedDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
    try {
      const response = await fetch(`/api/hr/totalStaffStat?date=${formattedDate}`);
      const data = await response.json(); // Parse the JSON response
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  // Fetch data on component mount and when date changes
  useEffect(() => {
    fetchStats(date); // Fetch data for the default date (today's date) on component mount
  }, [date]);

  // Handle date change from input
  const handleDateChange = (event) => {
    const selectedDate = new Date(event.target.value);
    setDate(selectedDate);
  };

  // Fetch department-specific WFH stats and individual staff details
  const fetchDeptStats = async (department) => {
    try {
      const formattedDate = date.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
      const response = await fetch(`/api/hr/DeptStaffStat?date=${formattedDate}&department=${department}`);
      const data = await response.json();
      setSelectedDeptData(data.wfhStats); // Store the department-specific WFH stats
      setWfhStaff(data.wfhStaff); // Store the WFH staff data
    } catch (error) {
      console.error('Error fetching department data:', error);
    }
  };

  // Handle bar click event
  const handleBarClick = (event, chartElement) => {
    if (chartElement.length === 0) return; // No click on a bar
    const departmentIndex = chartElement[0].index; // Get the index of the clicked department
    const department = Object.keys(stats)[departmentIndex]; // Get the department name from the index
    fetchDeptStats(department); // Fetch stats for the clicked department
  };

  // Prepare bar chart data for all departments in one graph
  const createChartData = () => {
    const departments = Object.keys(stats); // Get department names
    const wfoCounts = departments.map((dept) => stats[dept].wfo); // WFO counts for each department
    const wfhCounts = departments.map((dept) => stats[dept].wfh); // WFH counts for each department

    return {
      labels: departments, // Department names as labels
      datasets: [
        {
          label: 'WFO (Work From Office)',
          data: wfoCounts, // WFO counts
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'WFH (Work From Home)',
          data: wfhCounts, // WFH counts
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Prepare pie chart data for the selected department
  const createPieChartData = () => {
    if (!selectedDeptData) return null; // If no department is selected, return null

    const { am, pm, fullDay } = selectedDeptData.wfh;

    return {
      labels: ['AM WFH', 'PM WFH', 'Full-Day WFH'],
      datasets: [
        {
          label: 'WFH Stats',
          data: [am, pm, fullDay],
          backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)'],
          borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
          borderWidth: 1,
        },
      ],
    };
  };

  // Group WFH staff by AM, PM, and Full-Day
  const groupedWfhStaff = {
    am: wfhStaff.filter((staff) => staff.wfhPeriod === 'AM'),
    pm: wfhStaff.filter((staff) => staff.wfhPeriod === 'PM'),
    fullDay: wfhStaff.filter((staff) => staff.wfhPeriod === 'Full-Day'),
  };

  return (
    <main>
      <TopHeader
        mainText={'Schedule'}
        subText={"View Overall Schedule"}
      />
      <Container style={{ position: 'relative' }}>
        {/* Conditionally render DateInput only if not loading */}
        {!loading && (
          <Group style={{ position: 'absolute', right: 0, top: '0px' }} mb="xl">
            <DateInput
              value={date}
              onChange={setDate}
              clearable={false} // This removes the clear button
              label="Pick a date"
              placeholder="Pick a date"
            />
          </Group>
        )}

        {loading ? (
          <Flex direction="column" justifyContent="center" alignItems="center" height="200px">
            <Spinner size="xl" /> {/* Chakra Spinner */}
            <Text mt={4}>Loading data...</Text> {/* Loading data text below the spinner */}
          </Flex>
        ) : (
          <div style={{ marginBottom: '40px', marginTop: '13px' }}>
            <Bar
              data={createChartData()}
              options={{
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0, // Ensure integer values on y-axis
                    },
                  },
                },
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  title: {
                    display: true,
                    text: 'Staff Statistics by Department',
                  },
                  tooltip: {
                    enabled: true, // Enable tooltips on hover
                    callbacks: {
                      label: function (tooltipItem) {
                        const label = tooltipItem.dataset.label || '';
                        const value = tooltipItem.raw;
                        return `${label}: ${value}`; // Customize tooltip format
                      },
                    },
                  },
                },
                hover: {
                  mode: 'index', // Highlight all related bars on hover
                  intersect: false, // Display tooltip even if hovering slightly off the bar
                },
                onClick: (event, chartElement) => handleBarClick(event, chartElement), // Handle bar click
              }}
            />
          </div>
        )}

        {/* Conditionally render pie chart and accordion if a department is clicked */}
        {!loading && selectedDeptData ? (
          <Flex justifyContent="space-between" alignItems="flex-start" mt="40px">
            <div style={{ width: '500px', height: '500px' }}>
              <Title order={4} align="center">Department: {selectedDeptData.department} - WFH Stats</Title>
              <Pie
                data={createPieChartData()}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: {
                      display: true,
                      text: 'WFH Breakdown (AM, PM, Full-Day)',
                    },
                    tooltip: {
                      callbacks: {
                        label: function (tooltipItem) {
                          const dataset = tooltipItem.dataset;
                          const total = dataset.data.reduce((acc, value) => acc + value, 0); // Calculate total of all segments
                          const currentValue = dataset.data[tooltipItem.dataIndex]; // Get the current value
                          const percentage = ((currentValue / total) * 100).toFixed(2); // Calculate percentage
                          return `${tooltipItem.label}: ${percentage}%`; // Display the label with percentage
                        },
                      },
                    },
                  },
                }}
              />
            </div>

            {/* Accordion for WFH Stats grouped by AM, PM, and Full-Day */}
            <Accordion allowMultiple width="300px">
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      AM WFH ({groupedWfhStaff.am.length} staff)
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  {groupedWfhStaff.am.length > 0 ? (
                    groupedWfhStaff.am.map((staff) => (
                      <Text key={staff.id}>{staff.name}</Text>
                    ))
                  ) : (
                    <Text>No AM WFH staff</Text>
                  )}
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      PM WFH ({groupedWfhStaff.pm.length} staff)
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  {groupedWfhStaff.pm.length > 0 ? (
                    groupedWfhStaff.pm.map((staff) => (
                      <Text key={staff.id}>{staff.name}</Text>
                    ))
                  ) : (
                    <Text>No PM WFH staff</Text>
                  )}
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      Full-Day WFH ({groupedWfhStaff.fullDay.length} staff)
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  {groupedWfhStaff.fullDay.length > 0 ? (
                    groupedWfhStaff.fullDay.map((staff) => (
                      <Text key={staff.id}>{staff.name}</Text>
                    ))
                  ) : (
                    <Text>No Full-Day WFH staff</Text>
                  )}
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Flex>
        ) : (
          // Placeholder message when no department is clicked and no loading
          !loading && <Text align="center" mt="40px">Click a graph to show the breakdown of WFH</Text>
        )}
      </Container>
    </main>
  );
};

export default statsPage;
