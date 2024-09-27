import { Box, Flex, Text, VStack, Badge, Button } from "@chakra-ui/react";

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
      maxW="900px"
      p="6"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="md"
      bg={boxBgColor} // Dynamic background color
      color={textColor} // Dynamic text color
      ml="auto"
      mr="auto"
    >
      <VStack spacing={4} align="stretch">
        <Flex justify="space-between">
          <Badge colorScheme="orange">Pending</Badge>
          <Badge colorScheme={getTypeBadgeColor(application_type)}>{application_type}</Badge>
        </Flex>

        <Text fontWeight="bold" fontSize="lg">
          {"Work-From-Home"}
        </Text>

        <Text fontSize="sm">
          {requestor_remarks || "No remarks provided"}
        </Text>

        <Flex justify="space-between" fontSize="sm">
          <Box>
            <Text>Start Date:</Text>
            <Text>{formatDate(start_date)}</Text>
          </Box>
          <Box>
            <Text>Start Time:</Text>
            <Text>{formatTime(start_date)}</Text>
          </Box>
        </Flex>

        <Button
          colorScheme="red"
          variant="outline"
          size="sm"
          mt="4"
          onClick={() => onWithdraw({ start_date, application_type })}
        >
          Withdraw
        </Button>
      </VStack>
    </Box>
  );
};

export default PendingApplicationCard;
