import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text
} from "@chakra-ui/react";

const WithdrawalModal = ({ isOpen, onClose, applicationType, startDate, endDate, onConfirm }) => {
  // Format the date to display only the date part (e.g., YYYY-MM-DD)
  const formatDate = (datetime) => {
    return new Date(datetime).toLocaleDateString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Confirm Withdrawal?</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>Type: {applicationType}</Text>
          <Text>Start Date: {formatDate(startDate)}</Text>
          <Text>End Date: {formatDate(endDate)}</Text>
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
