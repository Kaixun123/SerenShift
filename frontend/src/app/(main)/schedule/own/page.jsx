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
        <Box height="calc(68vh)" padding="16px">
          <Calendar />
        </Box>
      </Flex>
    </main>
  );
}
