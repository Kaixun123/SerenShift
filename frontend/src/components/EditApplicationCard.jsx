"use client";
import { useEffect, useState } from "react";
import FileUploader from "@/components/FileUpload";

// chakra-ui
import {
  Box,
  FormControl,
  Text,
  FormLabel,
  Select,
  Button,
  Textarea,
  useToast,
} from "@chakra-ui/react";

// mantine
import { DateInput } from "@mantine/dates";

export default function EditApplicationCard({ applicationData, onSave, onCancel }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [type, setType] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState([]);
  const [clearFiles, setClearFiles] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [recurrenceError, setRecurrenceError] = useState("");

  const today = new Date(); // Get today's date

  useEffect(() => {
    // Set initial values from applicationData
    if (applicationData) {
      setStartDate(new Date(applicationData.startDate));
      setEndDate(new Date(applicationData.endDate));
      setType(applicationData.application_type || ""); // Set default type
      setTimeSlot(applicationData.timeSlot || ""); // Set default timeslot
      setReason(applicationData.requestor_remarks || "");
      setRecurrenceRule(applicationData.recurrence_rule || "");
      setRecurrenceEndDate(applicationData.recurrence_end_date || "");
    }
  }, [applicationData]);

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const handleTypeSelect = (e) => {
    setType(e.target.value);
  };

  const handleTimeSlot = (e) => {
    setTimeSlot(e.target.value);
  };

  const handleReasonChange = (e) => {
    setReason(e.target.value);
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleFilesChange = (files) => {
    setFiles(files);
  };

  // Validate recurrence end date is after the event end date
  const handleRecurrenceEndDateChange = (date) => {
    const selectedRecurrenceEndDate = new Date(date);
    const eventEndDate = new Date(endDate);

    if (selectedRecurrenceEndDate <= eventEndDate) {
      setRecurrenceError("Recurrence end date must be after the event end date.");
    } else {
      setRecurrenceError("");
    }
    setRecurrenceEndDate(date);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!startDate) {
      toast({
        title: "Start Date is required.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      setLoading(false);
      return;
    }

    if (!endDate) {
      toast({
        title: "End Date is required.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      setLoading(false);
      return;
    }

    if (!type) {
      toast({
        title: "Please select a type of arrangement.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      setLoading(false);
      return;
    }

    if (!timeSlot) {
      toast({
        title: "Please select a timeslot.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      setLoading(false);
      return;
    }

    if (!reason) {
      toast({
        title: "Please provide a reason for your application.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      setLoading(false);
      return;
    }

    if (type === "Regular" && !recurrenceRule) {
      toast({
        title: "Please provide a recurrence rule for your regular application.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      setLoading(false);
      return;
    }

    if (type === "Regular" && !recurrenceEndDate) {
      toast({
        title: "Please provide a recurrence end date for your regular application.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
      setLoading(false);
      return;
    }

    // Determine the time to append based on the selected time slot
    const startHour = timeSlot === "am" ? 9 : timeSlot === "pm" ? 14 : 9; // 9 AM for full day
    const endHour = timeSlot === "am" ? 13 : timeSlot === "pm" ? 18 : 18; // 1 PM for AM and 6 PM for PM/full day

    // Create new Date objects with the correct time
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    startDateTime.setHours(startHour, 0, 0, 0); // Set start time
    endDateTime.setHours(endHour, 0, 0, 0); // Set end time

    // Prepare form data to pass to parent component
    const formData = {
      id: applicationData.id,
      application_type: type,
      startDate: startDateTime.toISOString(), // Format to ISO string if needed
      endDate: endDateTime.toISOString(), // Format to ISO string if needed
      timeSlot,
      reason,
      files,
      recurrence_rule: type === "Regular" ? recurrenceRule : null,
      recurrence_end_date: type === "Regular" ? recurrenceEndDate : null,
    };

    // Pass the collected data back to the parent component
    onSave(formData);

    // Reset form state
    handleClear();
    setType("");
    setTimeSlot("");
    setReason("");
    setFiles([]);
    setClearFiles(true);
    setTimeout(() => setClearFiles(false), 500);
    setRecurrenceRule("");
    setRecurrenceEndDate("");
    setLoading(false);
};


  // Cancel function to reset the form and close the card
  const handleCancel = () => {
    handleClear();
    setType("");
    setTimeSlot("");
    setReason("");
    setFiles([]);
    setRecurrenceRule("");
    setRecurrenceEndDate("");
    onSave(); // Call the onSave callback to refresh or close the card
  };

  return (
    <Box
      p={"20px"}
      borderRadius="16px"
      overflow="hidden"
      className="w-full lg:w-[500px] shadow-[0px_3px_10px_rgba(0,0,0,0.12)]"
    >
      <Text fontSize="2xl" mb={4}>
        Edit Application
      </Text>
      <form onSubmit={handleSubmit}>
        <FormControl mb={4}>
          <FormLabel>Start Date</FormLabel>
          <DateInput
            value={startDate}
            onChange={handleStartDateChange}
            placeholder="Select start date"
            minDate={today} // Disable past dates
            required
          />
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>End Date</FormLabel>
          <DateInput
            value={endDate}
            onChange={handleEndDateChange}
            placeholder="Select end date"
            minDate={today} // Disable past dates
            required
          />
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Type of Arrangement</FormLabel>
          <Select value={type} onChange={handleTypeSelect} required>
            <option value="">Select type</option>
            <option value="Regular">Regular</option>
            <option value="Ad Hoc">Ad Hoc</option>
          </Select>
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Timeslot</FormLabel>
          <Select value={timeSlot} onChange={handleTimeSlot} required>
            <option value="">Select timeslot</option>
            <option value="am">AM (09:00 - 13:00)</option>
            <option value="pm">PM (14:00 - 18:00)</option>
            <option value="fullDay">Full Day (09:00 - 18:00)</option>
          </Select>
        </FormControl>

        {type === "Regular" && (
          <>
            <FormControl mb={4}>
              <FormLabel>Recurrence Rule</FormLabel>
              <Textarea
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value)}
                placeholder="Enter recurrence rule"
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Recurrence End Date</FormLabel>
              <DateInput
                value={recurrenceEndDate}
                onChange={handleRecurrenceEndDateChange}
                placeholder="Select recurrence end date"
                required
              />
              {recurrenceError && (
                <Text color="red.500">{recurrenceError}</Text>
              )}
            </FormControl>
          </>
        )}

        <FormControl mb={4}>
          <FormLabel>Reason</FormLabel>
          <Textarea
            value={reason}
            onChange={handleReasonChange}
            placeholder="Enter reason"
            required
          />
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Upload Supporting Files</FormLabel>
          <FileUploader
            onFilesChange={handleFilesChange}
            clearFiles={clearFiles}
            fileList={files}
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          isLoading={loading}
          mr={4}
        >
          Save
        </Button>
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </form>
    </Box>
  );
}
