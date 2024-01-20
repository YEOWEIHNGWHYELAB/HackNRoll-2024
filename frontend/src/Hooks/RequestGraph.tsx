import { useCallback, useState, useContext } from "react";
import axios from "axios";
import { useSnackbar } from "notistack";
import { LoadingOverlayResourceContext } from "../Contexts/LoadingOverlayResource";
import HTTPAPIError from "../Errors/HTTPAPIERROR";
import setHeaderToken from "../Contexts/SetHeaderToken";


export default function RequestGraph() {
    const loadingOverlay = useContext(LoadingOverlayResourceContext);
    const { enqueueSnackbar } = useSnackbar();
    const { setLoading } = loadingOverlay;

    const [error, setError] = useState<any>(null);
    const [res, setRes] = useState<any>(null);

    const handleRequestResourceError = useCallback((err : any) => {
        const formattedError = HTTPAPIError(err);
        setError(formattedError);
        setLoading(false);
        enqueueSnackbar(formattedError);
    }, [enqueueSnackbar, setError, setLoading]);

    const loadFullGraph = useCallback(() => {
        setLoading(true);

        axios.get("/cred/fullGraph", setHeaderToken())
            .then((res) => {
                enqueueSnackbar("Graph loaded successfully!");
                setLoading(false);

                if (res) {
                    setRes(res);
                }
            })
            .catch(handleRequestResourceError);
    }, [enqueueSnackbar, setLoading, handleRequestResourceError]);

    return {
        res,
        loadFullGraph,
        error
    }
}