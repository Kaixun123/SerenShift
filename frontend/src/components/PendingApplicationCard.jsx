import { Box, Flex, Text, VStack, Badge, Button } from "@chakra-ui/react";

// react icon
import { IoCalendarOutline } from "react-icons/io5";
import { LuAlarmClock } from "react-icons/lu";

const PendingApplicationCard = ({
  start_date,
  end_date, // New prop for end date
  application_type,
  status,
  requestor_remarks,
  onWithdraw,
  first_name,
  last_name,
  position,
  canManage,
  occurence,
}) => {
  // Format the date to display as DD-MM-YYYY
  const formatDate = (datetime) => {
    const date = new Date(datetime);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
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
      p={"20px"} // Adjust padding to reduce overall size
      borderRadius="16px"
      overflow="hidden"
      className="w-full lg:w-[570px] shadow-[0px_3px_10px_rgba(0,0,0,0.12)]"
    >
      <Flex
        gap={"15px"}
        justify="space-between"
        align="flex-start"
        className="flex-col lg:flex-row"
      >
        {/* Left Side */}
        <VStack spacing={"15px"} align="flex-start" flex="1">
          {status ? (
            <Badge
              fontSize="xs"
              p={1}
              w={"95px"}
              borderRadius="4"
              textAlign="center"
              className="text-white bg-yellow-primary capitalize font-medium"
            >
              {status}
            </Badge>
          ) : (
            <></>
          )}
          <Flex gap={"4px"} flexDirection={"column"}>
            {canManage === true && first_name && last_name && position ? (
              <Text fontSize="lg" fontWeight={"bold"} flexWrap={"wrap"}>
                {first_name} {last_name} - {position}
              </Text>
            ) : (
              <></>
            )}
            {canManage === true && occurence ? (
              <Text fontSize="lg" fontWeight={"bold"} flexWrap={"wrap"}>
                Occurrence #{occurence}
              </Text>
            ) : (
              <></>
            )}
            <Text fontSize="sm">
              {requestor_remarks || "No remarks provided"}
            </Text>
          </Flex>
          {application_type ? (
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
          ) : (
            <></>
          )}
        </VStack>

        {/* Right Side */}
        <VStack spacing={"10px"} align="stretch" flex="1">
          {/* Combined gray box for start date and time */}
          <Box
            bg="gray.200"
            p={3}
            borderRadius="md"
            display="flex"
            flexDirection="column" // Column layout to stack label and date
            gap={"4px"}
          >
            <Text fontSize="sm" color="gray.600" fontWeight="bold">
              Start Date & Time:
            </Text>
            <Flex
              justifyContent="space-between"
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
                  {formatDate(start_date)} {/* Start Date */}
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
                  {formatTime(start_date)} {/* Start Time */}
                </Text>
              </Flex>
            </Flex>
          </Box>
          {/* Combined gray box for end date and time */}
          <Box
            bg="gray.200"
            p={3}
            borderRadius="md"
            display="flex"
            flexDirection="column" // Column layout to stack label and date
            gap={"4px"}
          >
            <Text fontSize="sm" color="gray.600" fontWeight="bold">
              End Date & Time:
            </Text>
            <Flex
              justifyContent="space-between"
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
                  {formatDate(end_date)} {/* End Date */}
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
                  {formatTime(end_date)} {/* End Time */}
                </Text>
              </Flex>
            </Flex>
          </Box>
          {canManage === false ? (
            <Button
              colorScheme="red"
              variant="outline"
              size="sm"
              onClick={() => onWithdraw({ start_date, application_type })}
            >
              Withdraw
            </Button>
          ) : (
            ""
          )}
        </VStack>
      </Flex>
    </Box>
  );
};

export default PendingApplicationCard;
