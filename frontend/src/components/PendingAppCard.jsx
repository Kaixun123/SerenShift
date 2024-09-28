import { Box, Flex, Text, VStack, Badge, Button } from "@chakra-ui/react";
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const PendingApplicationCard = ({
  start_date,
  application_type,
  requestor_remarks,
  onWithdraw,
}) => {
  // Format the date to display only the date part (e.g., YYYY-MM-DD)
  const formatDate = (datetime) => {
    return new Date(datetime).toLocaleDateString(); // Format as date
  };

  // Format the time to display only the time part (e.g., HH:MM AM/PM)
  const formatTime = (datetime) => {
    return new Date(datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Format as time
  };

  // Determine the background and text color based on the application type
  const isAdHoc = application_type === "Ad-hoc";
  const boxBgColor = isAdHoc ? "black" : "white";
  const textColor = isAdHoc ? "white" : "black";

  // Determine the badge color for the application type
  const getTypeBadgeColor = (type) => {
    if (type === "Ad-hoc") {
      return "whiteAlpha"; // White badge for contrast with black background
    } else if (type === "Regular") {
      return "pink"; // Pink badge for Regular
    }
    return "gray";
  };

  return (
    <Box
      w={["100%", "80%", "70%"]}
      maxW="800px" // Adjust the max width to reduce empty space
      p="4" // Adjust padding to reduce overall size
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="md"
      bg={boxBgColor} // Dynamic background color
      color={textColor} // Dynamic text color
      ml="auto"
      mr="auto"
    >
      <Flex justify="space-between" align="flex-start">
        {/* Left Side */}
        <VStack spacing={2} align="flex-start" flex="1"> {/* Increased spacing */}
          <Badge colorScheme="orange" fontSize="md" p={1} borderRadius="0" textAlign="center">
            Pending
          </Badge>
          <Text fontSize="sm">
            {requestor_remarks || "No remarks provided"}
          </Text>
          <Badge colorScheme={getTypeBadgeColor(application_type)} fontSize="xs" p={1} borderRadius="full" textAlign="center"> {/* Smaller font size */}
            {application_type}
          </Badge>
        </VStack>

        {/* Right Side */}
        <VStack spacing={3} align="stretch" ml={4} flex="1">
          {/* Combined gray box for date and time */}
          <Box
            bg="gray.200" // Light gray background
            p={3}
            borderRadius="md"
            display="flex"
            justifyContent="space-between" // Space between date and time
            alignItems="center"
          >
            <Flex alignItems="center">
              <CalendarTodayIcon color="action" />
              <Text ml={2}>{formatDate(start_date)}</Text>
            </Flex>
            <Flex alignItems="center">
              <AccessTimeIcon color="action" />
              <Text ml={4}>{formatTime(start_date)}</Text> {/* Increased margin for spacing */}
            </Flex>
          </Box>

          <Button
            colorScheme="red"
            variant="outline"
            size="sm"
            onClick={() => onWithdraw({ start_date, application_type })}
          >
            Withdraw
          </Button>
        </VStack>
      </Flex>
    </Box>
  );
};

export default PendingApplicationCard;
