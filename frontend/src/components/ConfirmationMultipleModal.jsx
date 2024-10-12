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

const Multiple = ({ isOpen, onClose, onConfirm, action, selectedApplications }) => {
  const toast = useToast(); // Initialize Chakra's toast hook

  const handleConfirm = async () => {
    try {
      // Trigger confirmation action (approve or reject) via API call
      await onConfirm(); // Wait for the onConfirm function to execute (this will call the API)

      // Show success toast based on action
      toast({
        title: action === "approve" ? "Applications Approved" : "Applications Rejected",
        description: `The applications have been successfully ${action === "approve" ? "approved" : "rejected"}.`,
        status: "success",
        duration: 3000, // Duration for the toast in milliseconds
        isClosable: true,
        position: "top", // Position of the toast
      });

      // Close the modal after confirming
      onClose();
    } catch (error) {
      // Show error toast if something goes wrong with the API call
      toast({
        title: "Action Failed",
        description: `There was an error trying to ${action} the applications.`,
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }
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
              ? `Are you sure you want to approve the applications of ` 
              : `Are you sure you want to reject the applications of ` }
            <Text as="span" fontWeight="bold">
              {selectedApplications.length} application{selectedApplications.length > 1 ? "s" : ""}
            </Text>
            ?
          </Text>
          {selectedApplications.map((application) => (
            <Text mt={2} key={application.id}>
              <Text as="span" fontWeight="bold">
                {application.first_name} {application.last_name}:
              </Text>{" "}
              {formatDateTime(application.start_date)} - {formatDateTime(application.end_date)}
            </Text>
          ))}
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

export default Multiple;
