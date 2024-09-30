import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
} from "@chakra-ui/react";

const WithdrawalModal = ({
  isOpen,
  onClose,
  applicationType,
  startDate,
  endDate,
  time, // New prop for time
  onConfirm,
}) => {
  // Format the date to display as DD-MM-YYYY
  const formatDate = (datetime) => {
    const date = new Date(datetime);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format the time to display only the time part (e.g., HH:MM AM/PM)
  const formatTime = (datetime) => {
    return new Date(datetime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }); // Format as time
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Confirm Withdrawal?</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>Type: {applicationType}</Text>
          <Text>Start Date: {formatDate(startDate)}</Text>
          <Text>End Date: {formatDate(endDate)}</Text>
          <Text>Time: {formatTime(startDate)}</Text> {/* New time field */}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="red" mr={3} onClick={onConfirm}>
            Yes, Withdraw
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default WithdrawalModal;
