import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Text,
  } from "@chakra-ui/react";
  
  const WithdrawalModal = ({ isOpen, onClose, selectedApp, onWithdraw }) => {
    return (
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
            <Button colorScheme="red" mr={3} onClick={onWithdraw}>
              Yes, Withdraw
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };
  
  export default WithdrawalModal;
  