import { Button } from "@chakra-ui/react";

export default function ReviewApplicationsButton({ isDisabled, onClick }) {

  return (
    <Button
      colorScheme={isDisabled ? "gray" : "orange"} // Change color scheme based on disabled state
      onClick={onClick}
      isDisabled={isDisabled}
    >
      Review Applications
    </Button>
  );
}
