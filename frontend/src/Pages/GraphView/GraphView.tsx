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
import setHeaderToken from "../../Contexts/SetHeaderToken";
import { Formik, Form, Field, FieldArray } from "formik";
import { NetworkDiagram } from "./NetworkDiagram";
import { GraphData, GraphSelection } from "./data";

import RequestGraph from "../../Hooks/RequestGraph";

interface FormData {
  [key: string]: string;
}

const GraphView: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({ username: "", password: ""});
  const [newFieldName, setNewFieldName] = useState("");

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
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
  }

  const handleAddField = (fieldName: string) => {
    setFormData((prevData) => ({
      [fieldName]: "",
      ...prevData
    }));

    setNewFieldName("");
  };

  const handleRemoveField = (fieldName: string) => {
    const updatedFormData = { ...formData };
    delete updatedFormData[fieldName];
    setFormData(updatedFormData);
  };

  const handleSubmit = () => {
    // Do something with the form data, e.g., send it to an API
    console.log(formData);
    handleClose();
    setActiveItem(undefined);
  };

  const { res, loadFullGraph } = RequestGraph();

  const [activeItem, setActiveItem] = useState<GraphSelection>();
  const [d3Graph, setD3Graph] = useState<GraphData>({ nodes: [], links: [] });

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

      <Button variant="outlined" onClick={handleClickOpen}>
        Open Dynamic Form
      </Button>
      <Dialog fullWidth open={open} onClose={handleClose}>
        <DialogTitle>Dynamic Form</DialogTitle>
        <DialogContent>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <TextField
              key="newFieldName"
              label="New Field Name"
              value={newFieldName || ''}
              onChange={(e) => handleNewFieldChange(e.target.value)}
              margin="normal"
            />

            <Button style={{ margin: '8px', background: "Green" }} variant="contained" onClick={() =>handleAddField(newFieldName)}>
              New
            </Button>
          </div>

          {Object.keys(formData).map((fieldName) => (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <TextField
                key={fieldName}
                label={fieldName}
                fullWidth
                value={formData[fieldName] || ''}
                onChange={(e) => handleChange(fieldName, e.target.value)}
                margin="normal"
              />

              <Button style={{ margin: '8px', background: "red" }} variant="contained" onClick={() =>handleRemoveField(fieldName)}>
                Remove
              </Button>
            </div>
          ))}

          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogContent>
      </Dialog>

      {activeItem !== undefined ? (
        <div>
          Selected: {activeItem.id} Type: {activeItem.type} Name:{" "}
          {activeItem.name}
        </div>
      ) : (
        ""
      )}

      <NetworkDiagram data={d3Graph} setActiveItem={setActiveItem} />
    </div>
  );
};

export default GraphView;
