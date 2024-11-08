import { Button } from "@chakra-ui/react";

export default function RejectApplicationButton({
  isDisabled,
  onClick,
  applicationStatus,
  applicationIndex,
}) {
  const getButtonText = (index) => {
    return applicationStatus[index]?.status === "Pending withdrawal"
      ? "Reject Withdrawal"
      : "Reject Application";
  };

  const buttonText = getButtonText(applicationIndex);

  return (
    <Button
      colorScheme={isDisabled ? "gray" : "red"} // Change color scheme based on disabled state
      onClick={onClick}
      isDisabled={isDisabled}
    >
      {buttonText}
    </Button>
  );
}
