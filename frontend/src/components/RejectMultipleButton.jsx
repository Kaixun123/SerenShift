import { Button } from "@chakra-ui/react";

export default function MultiRejectButton({ onClick }) {
  return (
    <Button 
      colorScheme={"red"} // Change color scheme based on disabled state
      onClick={onClick} 
    >
      Reject Selected 
    </Button>
  );
}
