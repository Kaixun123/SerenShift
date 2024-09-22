'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

export function Providers({ children }) {
    return (
        <ThemeProvider theme={theme}>
            <ChakraProvider>
                <CssBaseline />
                {children}
            </ChakraProvider>
        </ThemeProvider>)
}