import { Box, Button, FormControl, FormLabel, Input, Select, Textarea } from "@chakra-ui/react";
import { useState } from "react";

const EditApplicationCard = ({ applicationData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    arrangementType: applicationData.application_type || "",
    timeslot: applicationData.timeslot || "",
    reason: applicationData.requestor_remarks || "",
    startDate: applicationData.start_date || "",
    endDate: applicationData.end_date || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Box w={"100%"} p={"20px"} borderRadius="16px" boxShadow="md" bg="white">
      <FormControl>
        <FormLabel>Type of Arrangement</FormLabel>
        <Select
          name="arrangementType"
          value={formData.arrangementType}
          onChange={handleChange}
        >
          <option value="Regular">Regular</option>
          <option value="Ad Hoc">Ad Hoc</option>
        </Select>
      </FormControl>

      <FormControl mt={4}>
        <FormLabel>Timeslot</FormLabel>
        <Select name="timeslot" value={formData.timeslot} onChange={handleChange}>
          <option value="AM">AM (09:00 - 13:00)</option>
          <option value="PM">PM (14:00 - 18:00)</option>
          <option value="Full Day">Full Day (09:00 - 18:00)</option>
        </Select>
      </FormControl>

      <FormControl mt={4}>
        <FormLabel>Start Date</FormLabel>
        <Input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
        />
      </FormControl>

      <FormControl mt={4}>
        <FormLabel>End Date</FormLabel>
        <Input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
        />
      </FormControl>

      <FormControl mt={4}>
        <FormLabel>Reason</FormLabel>
        <Textarea name="reason" value={formData.reason} onChange={handleChange} />
      </FormControl>

      <Button colorScheme="blue" mt={4} onClick={handleSubmit}>
        Save
      </Button>
      <Button variant="outline" mt={4} ml={4} onClick={onCancel}>
        Cancel
      </Button>
    </Box>
  );
};

export default EditApplicationCard;
