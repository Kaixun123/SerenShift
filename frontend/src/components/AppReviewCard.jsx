import { Box, Text } from "@chakra-ui/react";

const ApplicationReviewCard = ({
  startDate = "",
  endDate = "",
  applicationType = "N/A",
  applicantName = "N/A",
  reason = "N/A",
  supportingDocs = "N/A",
}) => {
  // Function to format the date to dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"; // Handle empty date
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString).toLocaleDateString("en-GB", options); // en-GB formats it as dd/mm/yyyy
  };

  return (
    <Box>
      <Text fontSize="lg" fontWeight="bold">
        Applicant: {applicantName}
      </Text>
      <Text>Arrangement Type: {applicationType}</Text>
      <Text>Start Date and Time: {formatDate(startDate)}</Text>
      <Text>End Date and Time: {formatDate(endDate)}</Text>
      <Text>Reason: {reason}</Text>
      <Text>Supporting Documents: {supportingDocs}</Text>
    </Box>
  );
};

export default ApplicationReviewCard;
