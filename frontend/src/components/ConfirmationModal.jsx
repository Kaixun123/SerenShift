import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  useToast,
} from "@chakra-ui/react";

// Function to format the date and time to dd/mm/yyyy hh:mm AM/PM
const formatDateTime = (dateString) => {
  if (!dateString) return "N/A"; // Handle empty date
  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Set to true for 12-hour format with AM/PM
  };
  return new Date(dateString).toLocaleString("en-GB", options); // en-GB formats as dd/mm/yyyy
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, action, selectedApplication }) => {
  const toast = useToast(); // Initialize Chakra's toast hook

  const handleConfirm = () => {
    // Trigger confirmation action (approve or reject)
    onConfirm();

    // Show success toast based on action
    toast({
      title: action === "approve" ? "Application Approved" : "Application Rejected",
      description: `The application for ${selectedApplication?.first_name} ${selectedApplication?.last_name} has been successfully ${action === "approve" ? "approved" : "rejected"}.`,
      status: "success",
      duration: 3000, // Duration for the toast in milliseconds
      isClosable: true,
      position: "top", // Position of the toast
    });

    // Close the modal after confirming
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Confirm {action === "approve" ? "Approval" : "Rejection"}
        </ModalHeader>
        <ModalBody>
          <Text>
            {action === "approve"
              ? `Are you sure you want to approve the application of `
              : `Are you sure you want to reject the application of `}
            <Text as="span" fontWeight="bold">
              {selectedApplication?.first_name} {selectedApplication?.last_name}
            </Text>
            ?
          </Text>
          <Text mt={2}>
            <Text as="span" fontWeight="bold">Date: </Text>
            {formatDateTime(selectedApplication?.start_date)} - {formatDateTime(selectedApplication?.end_date)}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme={action === "approve" ? "green" : "red"}
            mr={3}
            onClick={handleConfirm} // Call the handleConfirm function
          >
            Yes
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmationModal;
