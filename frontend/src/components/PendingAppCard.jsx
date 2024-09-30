import { Box, Flex, Text, VStack, Badge, Button } from "@chakra-ui/react";

// react icon
import { IoCalendarOutline } from "react-icons/io5";
import { LuAlarmClock } from "react-icons/lu";

const PendingApplicationCard = ({
  start_date,
  application_type,
  requestor_remarks,
  onWithdraw,
}) => {
  // Format the date to display as DD-MM-YYYY
  const formatDate = (datetime) => {
    const date = new Date(datetime);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format the time to display only the time part (e.g., HH:MM AM/PM)
  const formatTime = (datetime) => {
    return new Date(datetime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }); // Format as time
  };

  return (
    <Box
      w={"100%"}
      px={"30px"} // Adjust padding to reduce overall size
      py={"15px"}
      borderRadius="16px"
      overflow="hidden"
      className="shadow-[0px_3px_10px_rgba(0,0,0,0.12)]"
    >
      <Flex justify="space-between" align="flex-start">
        {/* Left Side */}
        <VStack spacing={"18px"} align="flex-start" flex="1">
          <Badge
            fontSize="xs"
            p={1}
            w={"95px"}
            borderRadius="4"
            textAlign="center"
            className="text-white bg-yellow-primary capitalize font-medium"
          >
            Pending
          </Badge>
          <Text fontSize="sm">
            {requestor_remarks || "No remarks provided"}
          </Text>
          <Badge
            fontSize="xs"
            p={1}
            w={"70px"}
            borderRadius="10px"
            textAlign="center"
            className={`text-white capitalize font-normal ${
              application_type === "Regular" ? "bg-[#DF4EE3]" : "bg-[#181818]"
            }`}
          >
            {application_type}
          </Badge>
        </VStack>

        {/* Right Side */}
        <VStack spacing={"20px"} align="stretch" flex="1">
          {/* Combined gray box for date and time */}
          <Box
            bg="gray.200" // Light gray background
            p={3}
            borderRadius="md"
            display="flex"
            justifyContent="space-between" // Space between date and time
            alignItems="center"
            flexWrap="wrap"
            gap={"2"}
          >
            <Flex alignItems="center">
              <Box className="flex items-center justify-center bg-white rounded-[50%] p-2">
                <IoCalendarOutline
                  className="w-5 h-5"
                  style={{ color: "#3D89FB" }}
                />
              </Box>
              <Text fontSize="sm" ml={2}>
                {formatDate(start_date)}
              </Text>
            </Flex>
            <Flex alignItems="center">
              <Box className="flex items-center justify-center bg-white rounded-[50%] p-2">
                <LuAlarmClock
                  className="w-5 h-5"
                  style={{ color: "#F29268" }}
                />
              </Box>
              <Text fontSize="sm" ml={2}>
                {formatTime(start_date)}
              </Text>
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
