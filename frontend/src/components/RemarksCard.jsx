import { Box, Text, Textarea } from "@chakra-ui/react";

export default function RequestorRemarks({ remarks = "" }) {
  return (
    <Box>
      <Text fontWeight="bold" color="gray.600" mb={2}>
        Remarks
      </Text>
      <Textarea
        placeholder="Write any remarks here..."
        value={remarks}
        bg="gray.50"
        borderColor="gray.300"
        focusBorderColor="blue.500"
        resize="none"
        height="100px"
      />
    </Box>
  );
}
