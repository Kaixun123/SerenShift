import { Button } from "@chakra-ui/react";

export default function ApproveApplicationButton({
  isDisabled,
  onClick,
  applicationStatus,
  applicationIndex,
}) {
  const getButtonText = (index) => {
    return applicationStatus[index]?.status === "Pending withdrawal"
      ? "Approve Withdrawal"
      : "Approve Application";
  };

  const buttonText = getButtonText(applicationIndex);

  return (
    <Button
      colorScheme={isDisabled ? "gray" : "green"} // Change color scheme based on disabled state
      onClick={onClick}
      isDisabled={isDisabled}
    >
      {buttonText}
    </Button>
  );
}
