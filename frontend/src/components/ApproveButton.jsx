import { Button } from "@chakra-ui/react";

export default function ApproveApplicationButton({ isDisabled }) {
  const handleClick = () => {
    console.log("Application approved");
  };

  return (
    <Button 
      colorScheme={isDisabled ? "gray" : "green"} // Change color scheme based on disabled state
      onClick={handleClick} 
      isDisabled={isDisabled}
    >
      Approve Application
    </Button>
  );
}
