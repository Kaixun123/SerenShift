import { Button } from "@chakra-ui/react";

export default function RejectApplicationButton({ isDisabled }) {
  const handleClick = () => {
    console.log("Application rejected");
  };

  return (
    <Button 
      colorScheme={isDisabled ? "gray" : "red"} // Change color scheme based on disabled state
      onClick={handleClick} 
      isDisabled={isDisabled}
    >
      Reject Application
    </Button>
  );
}
