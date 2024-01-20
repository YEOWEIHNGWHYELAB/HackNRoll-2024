import React, { useRef, useState } from 'react';

import { Button } from '@mui/material';

const UploadFile: React.FC = () => {
    const [file, setFile] = useState<any>(null);
    const fileInputRef = useRef<any>(null);

    const [isDragOver, setIsDragOver] = useState(false);

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

    const handleSubmit = () => {
        // To do: submit the file to backend by calling an API
        if (file) { 
            console.log(file);
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
