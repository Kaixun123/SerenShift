import { Box, Flex, Text, Link, Input } from "@chakra-ui/react";

const ApplicationDetailsCard = ({
    startDate = "",
    endDate = "",
    applicationType = "",
    first_name = "",
    last_name = "",
    position = "",
    requestor_remarks = "",
    supportingDocs = [],
  }) => {
    // Construct the applicant's full name
    const applicantName = `${first_name} ${last_name}`;
  
    // Function to format the date and time to dd/mm/yyyy hh:mm AM/PM
    const formatDateTime = (dateString) => {
      if (!dateString) return "N/A"; // Handle empty date
      const options = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true, // Optional: Set to false for 24-hour format
      };
      return new Date(dateString).toLocaleString("en-GB", options); // en-GB formats it as dd/mm/yyyy
    };
  
    // Date check
    const currentDate = new Date();
    const isPastDate = new Date(startDate) < currentDate || new Date(endDate) < currentDate;
  
    // Check if the application details are provided
    if (!first_name && !last_name) {
      return (
        <Box
          p={4}
          border="1px solid #E2E8F0"
          borderRadius="md"
          boxShadow="sm"
          maxW="auto"
          bg="white"
        >
          <Text textAlign="center" fontWeight="bold" color="gray.500">
            No WFH applications selected
          </Text>
        </Box>
      );
    }

    const supportingDocLinks = 
      <ul style={{ listStyleType: 'disc', paddingLeft: '20px' }}>
      {supportingDocs.map((doc, index) => (
        <li key={`doc_${index}`}>
          <Link href={doc.download_url} color="blue.500" isExternal>
            <Text>{doc.file_name}.{doc.file_extension}</Text>
          </Link>
        </li>
      ))}
    </ul>
    ;
    
  
    return (
      <Box
        p={4}
        border="1px solid #E2E8F0"
        borderRadius="md"
        boxShadow="sm"
        maxW="auto"
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
            <Text fontWeight="bold">Applicant Position</Text>
            <Input
              isReadOnly
              value={position}
              bg="gray.100"
              border="none"
              size="sm"
              width="70%"
            />
          </Flex>
  
          <Flex align="center" justify="space-between">
            <Text fontWeight="bold">Type of Arrangement</Text>
            <Input
              isReadOnly
              value={applicationType}
              bg="gray.100"
              border="none"
              size="sm"
              width="70%"
            />
          </Flex>
  
          <Flex align="center" justify="space-between">
            <Text fontWeight="bold">Start Date/Time</Text>
            <Input
              isReadOnly
              value={formatDateTime(startDate) || "23/09/2024 01:00 PM"}
              bg={isPastDate ? "red.100" : "gray.100"} // Change background color to red if past date
              border="none"
              size="sm"
              width="70%"
            />
          </Flex>
  
          <Flex align="center" justify="space-between">
            <Text fontWeight="bold">End Date/Time</Text>
            <Input
              isReadOnly
              value={formatDateTime(endDate) || "23/09/2024 06:00 PM"}
              bg={isPastDate ? "red.100" : "gray.100"} // Change background color to red if past date
              border="none"
              size="sm"
              width="70%"
            />
          </Flex>
  
          <Flex align="center" justify="space-between">
            <Text fontWeight="bold">Requestor Remarks</Text>
            <Input
              isReadOnly
              value={requestor_remarks}
              bg="gray.100"
              border="none"
              size="sm"
              width="70%"
            />
          </Flex>
          {supportingDocs.length > 0 && (
            <Flex direction="column" align="start" justify="space-between">
              <Text fontWeight="bold">Supporting Documents</Text>
              {supportingDocLinks}
            </Flex>
          )}
        </Flex>
      </Box>
    );
  };

export default ApplicationDetailsCard;
