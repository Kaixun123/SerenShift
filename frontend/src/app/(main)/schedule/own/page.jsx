"use client";
import Calendar from "@/components/Calendar";
import "@/components/Calendar.css";
import TopHeader from "@/components/TopHeader";
import { Box, Flex } from "@chakra-ui/react";

export default function OwnSchedulePage() {
  return (
    <main>
      <Flex direction="column" flex="1">
        <Box position="relative" zIndex="2">
          <TopHeader
            mainText={`My Schedule`}
          />
        </Box>
        <Box height="calc(50vh)">
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
          <Calendar />
        </Box>
      </Flex>
    </main>
  );
}
