import { Box, Text } from "@chakra-ui/react";

export default function RequestorRemarks({ remarks = "No remarks provided." }) {
  return (
    <Box>
      <Text fontWeight="bold">Requestor Remarks:</Text>
      <Text>{remarks}</Text>
    </Box>
  );
}
