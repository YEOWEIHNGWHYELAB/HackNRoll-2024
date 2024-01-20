import React, { useEffect, useState, useMemo } from 'react'
import PropTypes from "prop-types";
import { ThemeProvider, createTheme } from "@mui/material/styles";

export const ThemeModeContext = React.createContext({
    toggleThemeMode: () => { }
});

const getDesignTokens = (mode : any) => {
    return {
        palette: {
            mode
        }
    }
}

export default function ThemeModeProvider({ children } : { children : any }) {
    // Defaults to dark Theme
    const [mode, setMode] = useState("dark");

    // Check the themeMode used in local storage, if can't get just set to dark
    useEffect(() => {
        const savedMode = localStorage.getItem('ThemeMode') || 'dark';
        setMode(savedMode);
    }, [setMode]);

    useEffect(() => {
        localStorage.setItem("ThemeMode", mode);
    }, [mode]);

    const themeMode = useMemo(() => {
        return {
            // Toggle Light/Dark Theme
            toggleThemeMode: () => {
                setMode((prevMode) => {
                    if (prevMode === "light") {
                        return "dark"
                    }

                    return "light"
                })
            }
        }
    }, [setMode]);

    const theme = useMemo(() => {
        return createTheme(getDesignTokens(mode))
    }, [mode])

    return (
        <ThemeModeContext.Provider value={themeMode} >
            <ThemeProvider theme={theme} >
                {children}
            </ThemeProvider>
        </ThemeModeContext.Provider>
    )
}

ThemeModeProvider.propTypes = {
    children: PropTypes.node
}