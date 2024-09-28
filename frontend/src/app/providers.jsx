"use client";
import { MantineProvider } from "@mantine/core";
import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

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
