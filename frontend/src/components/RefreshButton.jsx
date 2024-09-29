import React from "react";
import { Button } from "@chakra-ui/react";

// react icon
import { IoRefresh } from "react-icons/io5";

export default function RefreshButton({ isRefresh, isLoading }) {
  return (
    <div>
      <Button
        rightIcon={<IoRefresh />}
        colorScheme="blue"
        variant="ghost"
        isLoading={isLoading}
        onClick={isRefresh}
        loadingText="Refreshing"
        spinnerPlacement="end"
      >
        Refresh
      </Button>
    </div>
  );
}
