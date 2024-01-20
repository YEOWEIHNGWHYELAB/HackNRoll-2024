import React, { useRef, useState } from "react";

import { Button } from "@mui/material";
import setHeaderToken from "../../Contexts/SetHeaderToken";
import axios from "axios";
import { useSnackbar } from "notistack";

const UploadFile: React.FC = () => {
  const [file, setFile] = useState<any>(null);
  const fileInputRef = useRef<any>(null);

  const [isDragOver, setIsDragOver] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const handleDrop = (event: any) => {
    event.preventDefault();
    const uploadedFile = event.dataTransfer.files[0];
    setFile(uploadedFile);
    setIsDragOver(false);
  };

  const handleDragEnter = (event: any) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleSubmit = async () => {
    if (file) {
      const formData = new FormData();
      formData.append("File", file);

      try {
        const res = await axios.post(
          "/cred/addcsv",
          formData,
          setHeaderToken()
        );

        if (res.status !== 200) throw new Error("Error with CSV upload!");

        enqueueSnackbar("Credential added successfully!");
      } catch (error) {
        enqueueSnackbar(error as string);
      }
    }
  };

  const handleFileChange = (event: any) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
  };

  return (
    <div>
      <h1>Upload Credentials</h1>

      <Button
        variant="outlined"
        onClick={handleSubmit}
        style={{ margin: "2px" }}
      >
        Submit
      </Button>

      <input
        style={{
          display: "none",
        }}
        id="file-upload"
        multiple
        type="file"
        onChange={handleFileChange}
        ref={fileInputRef}
      />

      <div
        onDragOver={handleDragEnter}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          width: "100%",
          height: "300px",
          border: isDragOver ? "2px dashed #888" : "2px dashed #ccc",
          borderRadius: "5px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          fontSize: "18px",
          fontWeight: "bold",
          color: "#888",
          margin: "20px 0",
        }}
      >
        {file ? file.name : "Drag and drop the csv file here"}
      </div>
    </div>
  );
};

export default UploadFile;
