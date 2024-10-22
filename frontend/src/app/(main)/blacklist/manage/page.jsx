'use client'

import { useState, useEffect } from 'react';
import { Table, Thead, Tbody, Tfoot, Tr, Th, Td, TableCaption, TableContainer, useToast } from '@chakra-ui/react';
import TopHeader from "@/components/TopHeader";

export default function ManageBlacklistPage() {
    const toast = useToast();
    const [blacklists, setBlacklists] = useState([]);
    const retrieveBlacklists = async () => {
        let response = await fetch('/api/blacklist/getBlacklistedDates', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        if (response.ok) {
            let data = await response.json();
            setBlacklists(data);
        } else if (response.status === 403 || response.status === 401) {
            toast({
                title: "Unauthorized",
                description: "You are not authorized to view this page",
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "top-right"
            });
        } else {
            toast({
                title: "Error",
                description: "Failed to retrieve blacklist dates",
                status: "error",
                duration: 9000,
                isClosable: true,
                position: "top-right"
            });
        }
    }
    return (
        <main>
            <TopHeader mainText={`Manage Blacklist`} subText={`Control when your subordinates can submit applications`} />
            <TableContainer>
                <Table variant='simple'>
                    <TableCaption>Active Blacklists</TableCaption>
                    <Thead>
                        <Tr>
                            <Th>To convert</Th>
                            <Th>into</Th>
                            <Th isNumeric>multiply by</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        <Tr>
                            <Td>inches</Td>
                            <Td>millimetres (mm)</Td>
                            <Td isNumeric>25.4</Td>
                        </Tr>
                        <Tr>
                            <Td>feet</Td>
                            <Td>centimetres (cm)</Td>
                            <Td isNumeric>30.48</Td>
                        </Tr>
                        <Tr>
                            <Td>yards</Td>
                            <Td>metres (m)</Td>
                            <Td isNumeric>0.91444</Td>
                        </Tr>
                    </Tbody>
                    <Tfoot>
                        <Tr>
                            <Th>To convert</Th>
                            <Th>into</Th>
                            <Th isNumeric>multiply by</Th>
                        </Tr>
                    </Tfoot>
                </Table>
            </TableContainer>
        </main>
    )
}