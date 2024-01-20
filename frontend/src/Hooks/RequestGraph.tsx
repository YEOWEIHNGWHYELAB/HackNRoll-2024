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

    /**
     * Get username
     */
    const getUsername = useCallback(async () => {
        try {
            return await axios.get("/auth/whoami", setHeaderToken());
        } catch (error) {
            handleRequestResourceError(error);
        }
    }, [handleRequestResourceError]);

    /**
     * Load the full graph from the backend
     */
    const loadFullGraph = useCallback(() => {
        // Function body
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

    /**
     * Create a new credential node
     */
    const createCred = useCallback(async (cred : any) => {
        setLoading(true);

        const res = await getUsername();
        cred["created_by"] = res?.data?.username;

        axios.post("/cred/add", cred, setHeaderToken())
            .then((res) => {
                enqueueSnackbar("Credential added successfully!");
                setLoading(false);
                window.location.reload();
            })
            .catch(handleRequestResourceError);
    }, [setLoading, getUsername, handleRequestResourceError, enqueueSnackbar]);

    /**
     * Update a credential node
     */
    const updateCred = useCallback((cred : any) => {
        setLoading(true);

        axios.patch("/cred/add", cred, setHeaderToken())
            .then((res) => {
                enqueueSnackbar("Credential updated successfully!");
                setLoading(false);
                window.location.reload();
            })
            .catch(handleRequestResourceError);
    }, [setLoading, handleRequestResourceError, enqueueSnackbar]);

    /**
     * Delete a credential node, warning: this will delete all relations to this node as well
     */
    const deleteCred = useCallback((cred : any) => {
        setLoading(true);

        axios.post("cred/delete", cred, setHeaderToken())
            .then((res) => {
                enqueueSnackbar("Credential deleted successfully!");
                setLoading(false);
                window.location.reload();
            })
            .catch(handleRequestResourceError);
    }, [enqueueSnackbar, handleRequestResourceError, setLoading]);

    /**
     * Create a new relation between 2 nodes
     */

    return {
        res,
        loadFullGraph,
        createCred,
        updateCred,
        deleteCred,
        error
    }
}