import { Box, Flex, Text } from "@chakra-ui/react";

const Legend = () => (
    <Box mb={4}>
      <Text fontSize="lg" fontWeight="bold">
        Legend:
      </Text>
      <Flex direction="row" align="center">
        <Box w="20px" h="20px" bg="#4CAF50" mr={2} /> {/* Green for Full Day */}
        <Text mr={4}>Full Day</Text>
        <Box w="20px" h="20px" bg="#F4C542" mr={2} /> {/* Yellow for AM */}
        <Text mr={4}>AM</Text>
        <Box w="20px" h="20px" bg="#4DA1FF" mr={2} /> {/* Blue for PM */}
        <Text>PM</Text>
      </Flex>
    </Box>
  );

export default Legend;