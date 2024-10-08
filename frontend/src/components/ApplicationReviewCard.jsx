import { Box, Text } from "@chakra-ui/react";

const ApplicationReviewCard = ({ startDate, endDate, applicationType, applicantName, reason, supportingDocs }) => {
  // Function to format the date to dd/mm/yyyy
  const formatDate = (dateString) => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString).toLocaleDateString("en-GB", options); // en-GB formats it as dd/mm/yyyy
  };

  return (
    <Box>
      {startDate && endDate && applicationType && applicantName ? (
        <>
          <Text fontSize="lg" fontWeight="bold">
            Applicant: {applicantName}
          </Text>
          <Text>Arrangement Type: {applicationType}</Text>
          <Text>Start Date and Time: {formatDate(startDate)}</Text>
          <Text>End Date and Time: {formatDate(endDate)}</Text>
          <Text>Reason: {reason}</Text>
          <Text>Supporting Documents: {supportingDocs}</Text>
        </>
      ) : (
        // Display this text when no application is selected
        <Text>No WFH applications to review</Text>
      )}
    </Box>
  );
};

export default ApplicationReviewCard;
