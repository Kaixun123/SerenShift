'use client'
import { useState, useEffect } from 'react';
import { Box, FormControl, FormLabel, Input, Heading, VStack } from '@chakra-ui/react';
import TopHeader from "@/components/TopHeader";

const ProfilePage = () => {
    const [employeeId, setEmployeeId] = useState(0);
    const [emailAddress, setEmailAddress] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [department, setDepartment] = useState('');
    const [position, setPosition] = useState('');
    const [securityRole, setSecurityRole] = useState('Staff');

    const retrieveOwnProfile = async () => {
        let response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        if (response.ok) {
            let data = await response.json();
            setEmployeeId(parseInt(data.id));
            setEmailAddress(data.email);
            setFirstName(data.first_name);
            setLastName(data.last_name);
            setDepartment(data.department);
            setPosition(data.position);
            setSecurityRole(data.securityRole);
        } else {
            console.error('Profile retrieval failed');
        }
    }
    useEffect(() => {
        retrieveOwnProfile();
    }, []);
    return (
        <main>
            <TopHeader
                mainText={`My Profile`}
            />
            <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100vh"
            >
                <Box
                    p={8}
                    width="80vh"
                    borderWidth={1}
                    borderRadius={8}
                    boxShadow="lg"
                >
                    <Heading as="h1" size="lg" textAlign="center" mb={4}>
                        My Profile
                    </Heading>
                    <VStack spacing={4}>
                        <FormControl id="employeeId">
                            <FormLabel>My Employee ID</FormLabel>
                            <Input type="number" value={employeeId} isReadOnly />
                        </FormControl>
                        <FormControl id="emailAddress">
                            <FormLabel>Email Address</FormLabel>
                            <Input type="email" value={emailAddress} isReadOnly />
                        </FormControl>
                        <FormControl id="firstName">
                            <FormLabel>First Name</FormLabel>
                            <Input type="text" value={firstName} isReadOnly />
                        </FormControl>
                        <FormControl id="lastName">
                            <FormLabel>Last Name</FormLabel>
                            <Input type="text" value={lastName} isReadOnly />
                        </FormControl>
                        <FormControl id="department">
                            <FormLabel>Department</FormLabel>
                            <Input type="text" value={department} isReadOnly />
                        </FormControl>
                        <FormControl id="position">
                            <FormLabel>Position</FormLabel>
                            <Input type="text" value={position} isReadOnly />
                        </FormControl>
                        <FormControl id="securityRole">
                            <FormLabel>My Role</FormLabel>
                            <Input type="text" value={securityRole} isReadOnly />
                        </FormControl>
                    </VStack>
                </Box>
            </Box>
        </main>
    );
};

export default ProfilePage;