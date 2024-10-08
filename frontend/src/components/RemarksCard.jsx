import { Box, Text } from "@chakra-ui/react";

export default function RequestorRemarks({ remarks }) {
  return (
    <Box>
      <Text fontWeight="bold">Requestor Remarks:</Text>
      <Text>{remarks || "No remarks provided."}</Text>
    </Box>
  );
}
