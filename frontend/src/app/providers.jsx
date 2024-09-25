'use client'

import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider } from '@mui/material/styles';
import { MantineProvider } from '@mantine/core';
import "@mantine/core/styles.css";
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

export function Providers({ children }) {
    return (
        <ThemeProvider theme={theme}>
            <MantineProvider>
                <ChakraProvider>
                    <CssBaseline />
                    {children}
                </ChakraProvider>
            </MantineProvider>
        </ThemeProvider>
    );
}
