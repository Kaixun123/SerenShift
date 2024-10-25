'use client'

import { useState, useEffect } from 'react';
import { useToast, FormControl, FormLabel, FormErrorMessage, FormHelperText, Box, Flex } from '@chakra-ui/react';
import TopHeader from "@/components/TopHeader";

export default function ManageBlacklistPage() {
    const toast = useToast();
    const [calendarValue, setCalendarValue] = useState([]);
    const [formattedDate, setFormattedDate] = useState({
        startDate: "",
        endDate: "",
    });
    const [timeSlot, setTimeSlot] = useState("");
    const [remarks, setRemarks] = useState("");
    const [recurrenceRule, setRecurrenceRule] = useState("");
    const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
    const [recurrenceError, setRecurrenceError] = useState("");
    const handleCalendarChange = (selectedDates) => {
        setCalendarValue(selectedDates);
        const [newStartDate, newEndDate] = selectedDates;

        setFormattedDate({
            startDate: newStartDate ? new Date(newStartDate).toDateString() : "",
            endDate: newEndDate ? new Date(newEndDate).toDateString() : "",
        });
    };
    const handleTypeSelect = (e) => {
        setType(e.target.value);
    };

    const handleTimeSlot = (e) => {
        setTimeSlot(e.target.value);
    };
    const handleClear = () => {
        setCalendarValue([]);
        setFormattedDate({
            startDate: "",
            endDate: "",
        });
    };
    const handleCreateBlacklist = async () => {
    }
    useEffect(() => {
    }, []);
    return (
        <main>

        </main>
    )
}