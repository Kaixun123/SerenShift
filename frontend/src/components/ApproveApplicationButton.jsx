import { Button } from "@chakra-ui/react";

export default function ApproveApplicationButton() {
  const handleClick = () => {
    console.log("Application approved");
  };

  return (
    <Button colorScheme="green" onClick={handleClick}>
      Approve Application
    </Button>
  );
}
