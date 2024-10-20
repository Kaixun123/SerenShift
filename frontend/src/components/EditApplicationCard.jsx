"use client";
// import components
import TopHeader from "@/components/TopHeader";
import { useEffect, useState } from "react";
import FileUploader from "@/components/FileUpload";

// chakra-ui
import {
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

export default function EditApplicationCard({ applicationData, onSave }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(null); // Set initial state to null
  const [endDate, setEndDate] = useState(null); // Set initial state to null
  const [type, setType] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState([]);
  const [clearFiles, setClearFiles] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [recurrenceError, setRecurrenceError] = useState(""); // error handling

  useEffect(() => {
    // Set initial values from applicationData
    if (applicationData) {
      setStartDate(new Date(applicationData.startDate)); // Convert to Date object
      setEndDate(new Date(applicationData.endDate)); // Convert to Date object
      setType(applicationData.application_type);
      setTimeSlot(applicationData.timeSlot);
      setReason(applicationData.requestor_remarks);
      setRecurrenceRule(applicationData.recurrence_rule || "");
      setRecurrenceEndDate(applicationData.recurrence_end_date || "");
    }
  }, [applicationData]);

  const handleStartDateChange = (date) => {
    setStartDate(date); // Set date object directly
  };

  const handleEndDateChange = (date) => {
    setEndDate(date); // Set date object directly
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
    setRecurrenceEndDate(date); // Set date directly
  };

  const updateApplication = async (e) => {
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

    try {
      if (type && timeSlot && reason && (!recurrenceError)) {
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        let formattedStartDateTime = formatDate(startDate);
        let formattedEndDateTime = formatDate(endDate);
        if (timeSlot === "am") {
          formattedStartDateTime += " 09:00:00";
          formattedEndDateTime += " 13:00:00";
        } else if (timeSlot === "pm") {
          formattedStartDateTime += " 14:00:00";
          formattedEndDateTime += " 18:00:00";
        } else if (timeSlot === "fullDay") {
          formattedStartDateTime += " 09:00:00";
          formattedEndDateTime += " 18:00:00";
        }

        const formData = new FormData();
        formData.append("id", applicationData.id); // Assuming applicationData has an id field
        formData.append("application_type", type);
        formData.append("startDate", formattedStartDateTime);
        formData.append("endDate", formattedEndDateTime);
        formData.append("requestor_remarks", reason);
        files.forEach((file) => {
          formData.append("files", file);
        });

        // Append only for regular applications 
        if (type === "Regular") {
          formData.append("recurrence_rule", recurrenceRule);
          formData.append("recurrence_end_date", recurrenceEndDate);
        }

        const response = await fetch("/api/application/updateApplication", {
          method: "PATCH", // Use PATCH for updating
          body: formData,
        });

        if (response.status === 200) {
          const result = await response.json();
          toast({
            title: result.message,
            position: "top-right",
            status: "success",
            duration: 5000,
            isClosable: true,
          });
          onSave(); // Call the onSave callback to refresh or close the card
        } else {
          const errorMessage = await response.json();
          toast({
            title: errorMessage.message,
            position: "top-right",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }

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
      }
    } catch (error) {
      console.error("Error updating application:", error);
      setLoading(false);
    }
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
    <div className="p-5 border rounded shadow">
      <Text fontSize="2xl" mb={4}>
        Edit Application
      </Text>
      <form onSubmit={updateApplication}>
        <FormControl mb={4}>
          <FormLabel>Start Date</FormLabel>
          <DateInput 
            value={startDate}
            onChange={handleStartDateChange}
            placeholder="Select start date"
            required
          />
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>End Date</FormLabel>
          <DateInput 
            value={endDate}
            onChange={handleEndDateChange}
            placeholder="Select end date"
            required
          />
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Type of Arrangement</FormLabel>
          <Select value={type} onChange={handleTypeSelect} placeholder="Select type of arrangement" required>
            <option value="Regular">Regular</option>
            <option value="Ad Hoc">Ad Hoc</option>
          </Select>
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Timeslot</FormLabel>
          <Select value={timeSlot} onChange={handleTimeSlot} placeholder="Select timeslot" required>
            <option value="am">AM (09:00 - 13:00)</option>
            <option value="pm">PM (14:00 - 18:00)</option>
            <option value="fullDay">Full Day (09:00 - 18:00)</option>
          </Select>
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Reason</FormLabel>
          <Textarea
            value={reason}
            onChange={handleReasonChange}
            placeholder="Enter reason for application"
            required
          />
        </FormControl>

        <FileUploader onChange={handleFilesChange} clearFiles={clearFiles} />

        <Button mt={4} colorScheme="teal" isLoading={loading} type="submit">
          Save Changes
        </Button>
        
        {/* Cancel Button */}
        <Button mt={4} colorScheme="red" onClick={handleCancel} ml={4}>
          Cancel
        </Button>
      </form>
    </div>
  );
}
