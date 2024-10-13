import { Button } from "@chakra-ui/react";

export default function MultiApproveButton({ onClick }) {
  return (
    <Button 
      colorScheme={"green"} // Change color scheme based on disabled state
      onClick={onClick} 
    >
      Approve Selected 
    </Button>
  );
}
