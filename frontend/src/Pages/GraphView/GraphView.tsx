import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from "@mui/material";

import { NetworkDiagram } from "./NetworkDiagram";
import { GraphData, GraphSelection } from "./data";
import RequestGraph from "../../Hooks/RequestGraph";

interface FormData {
  [key: string]: string;
}

const GraphView: React.FC = () => {
  const [nodeFilter, setNodeFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [isSelectingSrc, setIsSelectingSrc] = useState(false);
  const [isSelectingDest, setIsSelectingDest] = useState(false);
  const [openRelation, setOpenRelation] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    label: "Google",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [newFieldName, setNewFieldName] = useState("");

  const { res, loadFullGraph, createCred, updateCred, deleteCred } =
    RequestGraph();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClickOpenRelation = () => {
    setOpenRelation(true);
  };

  const handleClose = () => {
    setOpen(false);
    setActiveItem(undefined);
    setFormData({
      label: "Google",
      email: "",
      password: "",
      password_confirm: "",
    });
  };

  const handleCloseRelation = () => {
    setOpenRelation(false);
    setActiveItem(undefined);
  };

  const handleChange = (fieldName: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: value,
    }));
  };

  const handleNewFieldChange = (fieldName: string) => {
    setNewFieldName(fieldName);
  };

  const handleAddField = (fieldName: string) => {
    if (fieldName === "" || fieldName === undefined) {
      alert("Field name cannot be empty!");
    } else if (fieldName === "created_by" || fieldName === "password_confirm") {
      alert("Illegal field name!");
    } else {
      setFormData((prevData) => ({
        [fieldName]: "",
        ...prevData,
      }));
    }

    setNewFieldName("");
  };

  const handleRemoveField = (fieldName: string) => {
    const updatedFormData = { ...formData };
    delete updatedFormData[fieldName];
    setFormData(updatedFormData);
  };

  const handleSubmit = (isCreate: boolean) => {
    if (formData.created_by === undefined) {
      createCred((({ password_confirm, ...rest }) => rest)(formData));
    } else {
      let updateData = (({ password_confirm, ...rest }) => rest)(formData);
      updateData["elementId"] = activeItem?.id || "";
      updateCred(updateData);
    }

    handleClose();
    setActiveItem(undefined);
    setFormData({
      label: "Google",
      email: "",
      password: "",
      password_confirm: "",
    });
  };

  const handleDelete = () => {
    deleteCred({ elementId: activeItem?.id || "" });

    handleClose();
    setActiveItem(undefined);
    setFormData({
      label: "Google",
      email: "",
      password: "",
      password_confirm: "",
    });
  };

  const [activeItem, setActiveItem] = useState<GraphSelection>();
  const [activeItemSrc, setActiveItemSrc] = useState<GraphSelection>();
  const [activeItemDest, setActiveItemDest] = useState<GraphSelection>();

  const [d3Graph, setD3Graph] = useState<GraphData>({ nodes: [], links: [] });

  useEffect(() => {
    if (activeItem !== undefined) {
      if (activeItem.properties.password !== undefined) {
        setFormData({
          label: activeItem.name,
          ...activeItem.properties,
          password_confirm: "",
        });
      } else {
        setFormData({
          label: activeItem.name,
          ...activeItem.properties,
        });
      }

      if (!isSelectingDest && !isSelectingSrc) {
        handleClickOpen();
      }
    }
  }, [activeItem]);

  useEffect(() => {
    if (activeItem !== undefined && activeItem.type === "Node") {
      if (isSelectingSrc) {
        handleClickOpenRelation();
        setActiveItemSrc(activeItem);
      }

      if (isSelectingDest) {
        handleClickOpenRelation();
        setActiveItemDest(activeItem);
      }

      setIsSelectingSrc(false);
      setIsSelectingDest(false);
    }
  }, [activeItem, isSelectingDest, isSelectingSrc]);

  useEffect(() => {
    async function loadGraph() {
      try {
        loadFullGraph();
      } catch (err) {
        console.error(err);
      }
    }
    loadGraph();
  }, [loadFullGraph]);

  useEffect(() => {
    if (res) {
      const data = res.data;
      setD3Graph(data);
    }
  }, [res]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}
      >
        <Button
          variant="outlined"
          onClick={handleClickOpen}
          style={{ margin: "2px" }}
        >
          Create New Credential
        </Button>

        <Button
          variant="outlined"
          onClick={handleClickOpenRelation}
          style={{ margin: "2px" }}
        >
          Create New Relation
        </Button>
      </div>
      <div>
        <TextField
          onChange={(e) => setNodeFilter(e.target.value.trim())}
          label="Node Filter"
        />
      </div>

      <Dialog fullWidth open={open} onClose={handleClose}>
        <DialogTitle>Dynamic Credential Form</DialogTitle>
        <DialogContent>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <TextField
              key="newFieldName"
              label="New Field Name"
              value={newFieldName || ""}
              onChange={(e) => handleNewFieldChange(e.target.value)}
              margin="normal"
            />

            <Button
              style={{ margin: "8px", background: "Green" }}
              variant="contained"
              onClick={() => handleAddField(newFieldName)}
            >
              New
            </Button>
          </div>

          {Object.keys(formData)
            .filter((r) => r !== "created_by")
            .map((fieldName) => (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <TextField
                  key={fieldName}
                  label={fieldName}
                  type={
                    fieldName === "password" || fieldName === "password_confirm"
                      ? "password"
                      : "text"
                  }
                  fullWidth
                  value={formData[fieldName] || ""}
                  onChange={(e) => handleChange(fieldName, e.target.value)}
                  margin="normal"
                  disabled={activeItem !== undefined && fieldName === "label"}
                />

                <Button
                  style={{ margin: "8px", background: "red" }}
                  variant="contained"
                  onClick={() => handleRemoveField(fieldName)}
                  disabled={fieldName === "label"}
                >
                  Remove
                </Button>
              </div>
            ))}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                if (
                  formData.password !== undefined &&
                  formData.password_confirm !== undefined &&
                  formData.password !== formData.password_confirm
                ) {
                  alert("Passwords do not match!");
                } else {
                  handleSubmit(activeItem !== undefined);
                }
              }}
              style={{ margin: "2px" }}
            >
              {activeItem !== undefined ? "Update" : "Submit"}
            </Button>

            <Button
              variant="contained"
              disabled={
                activeItem === undefined || activeItem.name === "RootInfo"
              }
              onClick={() => {
                handleDelete();
              }}
              style={{
                margin: "2px",
                background:
                  activeItem === undefined || activeItem.name === "RootInfo"
                    ? "transparent"
                    : "red",
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog fullWidth open={openRelation} onClose={handleCloseRelation}>
        <DialogTitle>Dynamic Relation Form</DialogTitle>
        <DialogContent>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              style={{ margin: "2px" }}
              onClick={() => {
                setIsSelectingSrc(true);
                handleCloseRelation();
              }}
            >
              Select Source Node
            </Button>

            <Button
              variant="contained"
              color="secondary"
              style={{ margin: "2px" }}
              onClick={() => {
                setIsSelectingDest(true);
                handleCloseRelation();
              }}
            >
              Select Destination Node
            </Button>
          </div>

          {activeItemSrc !== undefined ? (
            <div>
              Selected Source Node: {activeItemSrc.id} Type:{" "}
              {activeItemSrc.type} Name: {activeItemSrc.name}
            </div>
          ) : (
            ""
          )}

          {activeItemDest !== undefined ? (
            <div>
              Selected Destination Node: {activeItemDest.id} Type:{" "}
              {activeItemDest.type} Name: {activeItemDest.name}
            </div>
          ) : (
            ""
          )}
        </DialogContent>
      </Dialog>

      <NetworkDiagram
        data={d3Graph}
        nodeFilter={nodeFilter}
        setActiveItem={setActiveItem}
      />
    </div>
  );
};

export default GraphView;
