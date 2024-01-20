import React, { useMemo, useState } from 'react'
import { Backdrop, Box, CircularProgress } from '@mui/material'
import PropTypes from 'prop-types'

export const LoadingOverlayResourceContext = React.createContext<{
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}>({
    setLoading: () => { }
});

// Control if the loading overlay is being shown on browser
export default function LoadingOverlayResource({ children } : { children : any }) {
    // loading controls if the loading overlay is shown
    const [loading, setLoading] = useState(false);
    // useMemo generates the overlay value containing the setLoading function
    const overlayValue = useMemo(() => {
        return { setLoading }
    }, [setLoading])

    return (
        <LoadingOverlayResourceContext.Provider value={overlayValue}>
            <Box sx={{
                position: "relative",
                display: "flex",
                width: "100%",
                height: "100vh"
            }}>
                <Backdrop sx={{
                    background: "rgba(0,0,0,0.1)",
                    display: "flex",
                    width: "100%",
                    height: "100vh",
                    position: "absolute"
                }} open={loading}>
                    <CircularProgress />
                </Backdrop>
                {children}
            </Box>
        </LoadingOverlayResourceContext.Provider>
    )
}

LoadingOverlayResource.propTypes = {
    children: PropTypes.node
}
