import { Box, Text, Textarea } from "@chakra-ui/react";

export default function ApproverRemarks({ remarks = "", onChange, isDisabled }) {
  return (
    <Box>
      <Text fontWeight="bold" color="gray.600" mb={2}>
        Remarks for all
      </Text>
      <Textarea
        placeholder="Write any remarks here..."
        value={remarks}
        onChange={(e) => onChange(e.target.value)} // Handle input change
        bg="gray.50"
        borderColor="gray.300"
        focusBorderColor="blue.500"
        resize="none"
        height="100px"
        isDisabled={isDisabled} // Use isDisabled prop to control input
      />
    </Box>
  );
}
