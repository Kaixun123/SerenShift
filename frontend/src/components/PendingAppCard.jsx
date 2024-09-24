import { Box, Flex, Text, VStack, Badge, Button } from "@chakra-ui/react";

const PendingArrangementCard = ({
  start_date,
  end_date,
  application_type,
  requestor_remarks,
  onWithdraw,
}) => {
  return (
    <Box
      w="350px"
      p="6"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="md"
      bg="white"
    >
      <VStack spacing={4} align="stretch">
        <Flex justify="space-between">
          <Badge colorScheme="orange">Pending</Badge>
          <Badge>{application_type}</Badge>
        </Flex>

        <Text fontWeight="bold" fontSize="lg">
          {application_type}
        </Text>

        <Text color="gray.500" fontSize="sm">
          {requestor_remarks || "No remarks provided"}
        </Text>

        <Flex justify="space-between" fontSize="sm" color="gray.500">
          <Box>
            <Text>Start Date:</Text>
            <Text>{start_date}</Text>
          </Box>
          <Box>
            <Text>End Date:</Text>
            <Text>{end_date}</Text>
          </Box>
        </Flex>

        <Button
          colorScheme="red"
          variant="outline"
          size="sm"
          mt="4"
          onClick={() => onWithdraw({ start_date, end_date, application_type })}
        >
          Withdraw
        </Button>
      </VStack>
    </Box>
  );
};

export default PendingArrangementCard;
