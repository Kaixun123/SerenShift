import { Button } from "@chakra-ui/react";

export default function ApproveDatesButton() {
  const handleClick = () => {
    console.log("Selected dates approved");
  };

  return (
    <Button 
      variant="outline"      // Outline variant for green border and no background fill
      colorScheme="green"    // Sets the font color and border color to green
      onClick={handleClick}
    >
      Approve Selected Dates
    </Button>
  );
}
