'use client'
import { Layout } from "@/components/Layout";
import TopHeader from "@/components/TopHeader";
import {
  Box,
  Flex,
  Text,
  VStack,
  Badge,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { useState } from "react";

export default function Home() {
  // Dummy data for pending applications
  const pendingApplications = [
    {
      id: 1,
      start_date: "2024-09-25",
      end_date: "2024-09-30",
      application_type: "Ad-hoc",
      requestor_remarks: "Need to take care of family",
    },
    {
      id: 2,
      start_date: "2024-10-01",
      end_date: "2024-10-05",
      application_type: "Regular",
      requestor_remarks: "Personal health reasons",
    },
    {
      id: 3,
      start_date: "2024-10-10",
      end_date: "2024-10-10",
      application_type: "Regular",
      requestor_remarks: "",
    },
  ];

  // State for the selected application to withdraw
  const [selectedApp, setSelectedApp] = useState(null);

  // Chakra UI modal hooks
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Function to handle the click event of the withdraw button
  const handleWithdrawClick = (app) => {
    setSelectedApp(app);
    onOpen();
  };

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

  return (
    <Layout>
      <TopHeader
        mainText={"New Schedule"}
        subText={"Plan your schedule timely and wisely!"}
      />
      <Flex mx="auto" maxWidth="50%">
        <Box className="p-[30px]">New application</Box>
        <VStack align="stretch" spacing={4} ml="auto" p={4}>
          {pendingApplications.map((item) => (
            <PendingArrangementCard
              key={item.id}
              start_date={item.start_date}
              end_date={item.end_date}
              application_type={item.application_type}
              requestor_remarks={item.requestor_remarks}
              onWithdraw={handleWithdrawClick}
            />
          ))}
        </VStack>
      </Flex>

      {/* Modal for withdrawal confirmation */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Withdrawal</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to withdraw the following application?
            </Text>
            <Text fontWeight="bold" mt={4}>
              Type: {selectedApp?.application_type}
            </Text>
            <Text>Start Date: {selectedApp?.start_date}</Text>
            <Text>End Date: {selectedApp?.end_date}</Text>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={onClose}>
              Yes, Withdraw
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
}
