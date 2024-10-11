import { Button } from "@chakra-ui/react";

export default function ApproveApplicationButton({ isDisabled, onClick }) {

  return (
    <Button 
      colorScheme={isDisabled ? "gray" : "green"} // Change color scheme based on disabled state
      onClick={onClick} 
      isDisabled={isDisabled}
    >
      Approve Application
    </Button>
  );
}
