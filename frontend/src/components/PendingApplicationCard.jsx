import { Box, Flex, Text, VStack, Badge, Button } from "@chakra-ui/react";
import { IoCalendarOutline } from "react-icons/io5";
import { LuAlarmClock } from "react-icons/lu";

const PendingApplicationCard = ({
  start_date,
  application_type,
  status,
  requestor_remarks,
  onWithdraw,
  onEdit, // Add an onEdit prop
  first_name,
  last_name,
  position,
  canManage,
  occurence,
}) => {
  const formatDate = (datetime) => {
    const date = new Date(datetime);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (datetime) => {
    return new Date(datetime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box w={"100%"} px={"30px"} py={"15px"} borderRadius="16px" overflow="hidden" className="shadow-[0px_3px_10px_rgba(0,0,0,0.12)]">
      <Flex gap={"15px"} justify="space-between" align="flex-start">
        <VStack spacing={"18px"} align="flex-start" flex="1">
          {status && (
            <Badge fontSize="xs" p={1} w={"95px"} borderRadius="4" textAlign="center" className="text-white bg-yellow-primary capitalize font-medium">
              {status}
            </Badge>
          )}
          <Flex gap={"4px"} flexDirection={"column"}>
            {canManage && first_name && last_name && position && (
              <Text fontSize="lg" fontWeight={"bold"} flexWrap={"wrap"}>
                {first_name} {last_name} - {position}
              </Text>
            )}
            {canManage && occurence && (
              <Text fontSize="lg" fontWeight={"bold"} flexWrap={"wrap"}>
                Occurrence #{occurence}
              </Text>
            )}
            <Text fontSize="sm">{requestor_remarks || "No remarks provided"}</Text>
          </Flex>
          {application_type && (
            <Badge fontSize="xs" p={1} w={"70px"} borderRadius="10px" textAlign="center" className={`text-white capitalize font-normal ${application_type === "Regular" ? "bg-[#DF4EE3]" : "bg-[#181818]"}`}>
              {application_type}
            </Badge>
          )}
        </VStack>
        <VStack spacing={"20px"} align="stretch" flex="1">
          <Box bg="gray.200" p={3} borderRadius="md" display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={"2"}>
            <Flex alignItems="center">
              <Box className="flex items-center justify-center bg-white rounded-[50%] p-2">
                <IoCalendarOutline className="w-5 h-5" style={{ color: "#3D89FB" }} />
              </Box>
              <Text fontSize="sm" ml={2}>
                {formatDate(start_date)}
              </Text>
            </Flex>
            <Flex alignItems="center">
              <Box className="flex items-center justify-center bg-white rounded-[50%] p-2">
                <LuAlarmClock className="w-5 h-5" style={{ color: "#F29268" }} />
              </Box>
              <Text fontSize="sm" ml={2}>
                {formatTime(start_date)}
              </Text>
            </Flex>
          </Box>

          {canManage === false ? (
            <Flex>
              <Button colorScheme="red" variant="outline" size="sm" onClick={() => onWithdraw({ start_date, application_type })}>
                Withdraw
              </Button>
              <Button colorScheme="blue" variant="outline" size="sm" ml={2} onClick={() => onEdit({ start_date, application_type })}>
                Edit
              </Button>
            </Flex>
          ) : (
            ""
          )}
        </VStack>
      </Flex>
    </Box>
  );
};

export default PendingApplicationCard;
