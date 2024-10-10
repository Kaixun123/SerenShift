import { Button } from "@chakra-ui/react";

export default function RejectApplicationButton() {
  const handleClick = () => {
    console.log("Application rejected");
  };

  return (
    <Button colorScheme="red" onClick={handleClick}>
      Reject Application
    </Button>
  );
}