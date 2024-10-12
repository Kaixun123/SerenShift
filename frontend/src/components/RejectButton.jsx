import { Button } from "@chakra-ui/react";

export default function RejectApplicationButton({ isDisabled, onClick }) {

  return (
    <Button 
      colorScheme={isDisabled ? "gray" : "red"} // Change color scheme based on disabled state
      onClick={onClick} 
      isDisabled={isDisabled}
    >
      Reject Application
    </Button>
  );
}
