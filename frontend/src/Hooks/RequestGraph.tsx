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

  const handleRequestResourceError = useCallback(
    (err: any) => {
      const formattedError = HTTPAPIError(err);
      setError(formattedError);
      setLoading(false);
      enqueueSnackbar(formattedError);
    },
    [enqueueSnackbar, setError, setLoading]
  );

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

    axios
      .get("/cred/fullGraph", setHeaderToken())
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
   * Check for password similarity from version control
   */
  const checkPasswordSimilarity = useCallback(
    (cred: { elementId: string; password: string }, succeessCallBack: any) => {
      setLoading(true);

      axios
        .post("/cred/checkpwd", cred, setHeaderToken())
        .then((res) => {
          setLoading(false);

          if (res.data.is_similar === false) {
            succeessCallBack();
          } else {
            alert("Password is similar to previous records, please change it!");
            enqueueSnackbar("Password checked failed!");
          }
        })
        .catch(handleRequestResourceError);
    },
    [enqueueSnackbar, handleRequestResourceError, setLoading]
  );

  /**
   * Create a new credential node
   */
  const createCred = useCallback(
    async (cred: any) => {
      setLoading(true);

      const res = await getUsername();
      cred["created_by"] = res?.data?.username;

      axios
        .post("/cred/add", cred, setHeaderToken())
        .then((res) => {
          enqueueSnackbar("Credential added successfully!");
          setLoading(false);
          window.location.reload();
        })
        .catch(handleRequestResourceError);
    },
    [setLoading, getUsername, handleRequestResourceError, enqueueSnackbar]
  );

  /**
   * Update a credential node
   */
  const updateCred = useCallback(
    (cred: any) => {
      setLoading(true);

      axios
        .patch("/cred/add", cred, setHeaderToken())
        .then((res) => {
          enqueueSnackbar("Credential updated successfully!");
          setLoading(false);
          window.location.reload();
        })
        .catch(handleRequestResourceError);
    },
    [setLoading, handleRequestResourceError, enqueueSnackbar]
  );

  /**
   * Delete a credential node, warning: this will delete all relations to this node as well
   */
  const deleteCred = useCallback(
    (cred: any) => {
      setLoading(true);

      axios
        .post("cred/delete", cred, setHeaderToken())
        .then((res) => {
          enqueueSnackbar("Credential deleted successfully!");
          setLoading(false);
          window.location.reload();
        })
        .catch(handleRequestResourceError);
    },
    [enqueueSnackbar, handleRequestResourceError, setLoading]
  );

  /**
   * Create a new relation between 2 nodes
   */
  const createCredRelation = useCallback(
    async (credRelation: any) => {
      setLoading(true);

      const res = await getUsername();
      credRelation["created_by"] = res?.data?.username;

      axios
        .post("/cred/relation", credRelation, setHeaderToken())
        .then((res) => {
          enqueueSnackbar("Credential relation added successfully!");
          setLoading(false);
          window.location.reload();
        })
        .catch(handleRequestResourceError);
    },
    [setLoading, getUsername, handleRequestResourceError, enqueueSnackbar]
  );

  /**
   * Delete a relation between 2 nodes
   */
  const deleteCredRelation = useCallback(
    async (credRelation: any) => {
      setLoading(true);

      axios
        .post("/cred/deleterelation", credRelation, setHeaderToken())
        .then((res) => {
          enqueueSnackbar("Credential relation deleted successfully!");
          setLoading(false);
          window.location.reload();
        })
        .catch(handleRequestResourceError);
    },
    [setLoading, handleRequestResourceError, enqueueSnackbar]
  );

  const clearBreached = useCallback(
    (elementId: string) => {
      axios
        .post("/cred/clearBreached", { elementId }, setHeaderToken())
        .then(() => {
          enqueueSnackbar("Breach cleared for selected node");
          setLoading(false);
          window.location.reload();
        })
        .catch(handleRequestResourceError);
    },
    [setLoading, handleRequestResourceError, enqueueSnackbar]
  );

  const addBreached = useCallback(async () => {
    setLoading(true);

    axios
      .post("/cred/addBreached", { message: "" }, setHeaderToken())
      .then((res) => {
        enqueueSnackbar("Checking for breaches");
        setLoading(false);
        window.location.reload();
      })
      .catch(handleRequestResourceError);
  }, [setLoading, handleRequestResourceError, enqueueSnackbar]);

  return {
    res,
    loadFullGraph,
    checkPasswordSimilarity,
    createCred,
    updateCred,
    deleteCred,
    createCredRelation,
    deleteCredRelation,
    clearBreached,
    error,
    addBreached,
  };
}
