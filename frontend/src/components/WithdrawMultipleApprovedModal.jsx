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

const WithdrawMultipleApprovedModal = ({
  isOpen,
  onClose,
  selectedApplications,
  onConfirm,
}) => {

  const toast = useToast();
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

  const handleConfirm = async () => {
    try {
      // Trigger confirmation action (approve or reject) via API call
      const res = await onConfirm(); // Wait for the onConfirm function to execute (this will call the API)
  
      if (res.ok) {
        // Show success toast based on action
        toast({
          title: "Applications Withdrawn",
          description: "The applications have been successfully withdrawn.",
          status: "success",
          duration: 3000, // Duration for the toast in milliseconds
          isClosable: true,
          position: "top-right", // Position of the toast
        });
  
        // Close the modal after confirming
        onClose();
      } else {
        // Show error toast if something goes wrong with the API call
        toast({
          title: "Withdraws Failed",
          description: "There was an error trying to withdraw the applications.",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      }
    } catch (error) {
      // Show error toast if something goes wrong with the API call
      toast({
        title: "Withdraws Failed",
        description: "There was an error trying to withdraw the applications.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Confirm Withdrawal
        </ModalHeader>
        <ModalBody>
          <Text>
            Are you sure you want to withdraw{" "}
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
            colorScheme="red"
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

export default WithdrawMultipleApprovedModal;
