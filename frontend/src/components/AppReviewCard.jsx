import { Box, Text, Flex, Select, Input, Link } from "@chakra-ui/react";

const ApplicationReviewCard = ({
  startDate = "",
  endDate = "",
  applicationType = "",
  applicantName = "",
  applicantTeam = "",
  reason = "",
  supportingDocs = "",
}) => {
  // Function to format the date to dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"; // Handle empty date
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString).toLocaleDateString("en-GB", options); // en-GB formats it as dd/mm/yyyy
  };

  return (
    <Box
      p={4}
      border="1px solid #E2E8F0"
      borderRadius="md"
      boxShadow="sm"
      maxW="400px"
      bg="white"
    >
      <Flex direction="column" gap={3}>
        <Flex align="center" justify="space-between">
          <Text fontWeight="bold">Applicant</Text>
          <Input
            isReadOnly
            value={applicantName}
            bg="gray.100"
            border="none"
            size="sm"
            width="70%"
          />
        </Flex>

        <Flex align="center" justify="space-between">
          <Text fontWeight="bold">Applicant's Team</Text>
          <Input
            isReadOnly
            value={applicantTeam}
            bg="gray.100"
            border="none"
            size="sm"
            width="70%"
          />
        </Flex>

        <Flex align="center" justify="space-between">
          <Text fontWeight="bold">Type of Arrangement</Text>
          <Select value={applicationType} size="sm" width="70%" bg="gray.100">
            <option value="Ad-hoc">Ad-hoc</option>
            <option value="Planned">Regular</option>
          </Select>
        </Flex>

        <Flex align="center" justify="space-between">
          <Text fontWeight="bold">Start Date/Time</Text>
          <Input
            isReadOnly
            value={formatDate(startDate) || "23/09/2024 01:00PM"}
            bg="gray.100"
            border="none"
            size="sm"
            width="70%"
          />
        </Flex>

        <Flex align="center" justify="space-between">
          <Text fontWeight="bold">End Date/Time</Text>
          <Input
            isReadOnly
            value={formatDate(endDate) || "23/09/2024 06:00PM"}
            bg="gray.100"
            border="none"
            size="sm"
            width="70%"
          />
        </Flex>

        <Flex align="center" justify="space-between">
          <Text fontWeight="bold">Reason</Text>
          <Input
            isReadOnly
            value={reason}
            bg="gray.100"
            border="none"
            size="sm"
            width="70%"
          />
        </Flex>

        <Flex align="center" justify="space-between">
          <Text fontWeight="bold">Supporting Documents</Text>
          <Link href="#" color="blue.500" isExternal>
            {supportingDocs}
          </Link>
        </Flex>
      </Flex>
    </Box>
  );
};

export default ApplicationReviewCard;
