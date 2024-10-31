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
  useToast,
} from "@chakra-ui/react";

const WithdrawApprovedModal = ({
  isOpen,
  onClose,
  applicantName,
  applicationType,
  startDate,
  endDate,
  datesArray = [],
  onConfirm,
}) => {

  const toast = useToast();

  // Format the date to display as DD-MM-YYYY
  const formatDate = (datetime) => {
    const date = new Date(datetime);
    const dayName = date.toLocaleDateString("en-GB", { weekday: "short" });
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${dayName} ${day}/${month}/${year}`;
  };

  // Format the time to display only the time part (e.g., HH:MM AM/PM)
  const formatTime = (datetime) => {
    return new Date(datetime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }); // Format as time
  };

  const formatDatesArray = () => {
    const formattedDates = datesArray
      .map(date => `• ${formatDate(date)}`)
      .join("\n");
  
    return (
      <Text whiteSpace="pre-line">
        {formattedDates}
      </Text>
    );
  };  
  
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Confirm Withdrawal?</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>Applicant Name: {applicantName}</Text>
          <Text>Type: {applicationType}</Text>
          {datesArray.length === 0 ? (
            <>
            <Text>Start Date: {formatDate(startDate)}</Text>
            <Text>End Date: {formatDate(endDate)}</Text>
            </>
          ) : (
            <>
            <Text>Date{datesArray.length > 1 ? 's' : ''} Selected: {formatDatesArray()}</Text>
            </>
          )}
          
          <Text>Time: {formatTime(startDate)} to {formatTime(endDate)}</Text> 
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="red" mr={3} onClick={handleConfirm}>
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

export default WithdrawApprovedModal;
