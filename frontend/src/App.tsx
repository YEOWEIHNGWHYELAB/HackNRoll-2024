import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { Box } from "@mui/material";
import {
  Navigate,
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import { SnackbarProvider } from "notistack";

import "./App.css";
import ThemeModeProvider from "./Contexts/ThemeModeProvider";
import AuthContextProvider from "./Contexts/AuthContextProvider";
import RequireAuth from "./Contexts/RequireAuth";
import RequireNotAuth from "./Contexts/RequireNotAuth";
import BaseLayout from "./BaseLayout";

import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";
import UploadFile from "./Pages/Dash/UploadFile";
import GraphView from "./Pages/GraphView/GraphView";

function App() {
  return (
    <ThemeModeProvider>
      <CssBaseline />
      <AuthContextProvider>
        <SnackbarProvider>
          <Router>
            <Box
              sx={{
                bgcolor: (theme) => theme.palette.background.default,
                minHeight: "100vh",
                width: "100%",
              }}
            >
              <Routes>
                <Route index element={<Navigate to="/auth/login" />} />
                <Route element={<RequireAuth />}>
                  <Route element={<BaseLayout />}>
                    <Route path="/upload" element={<UploadFile />} />
                  </Route>
                  <Route element={<BaseLayout />}>
                    <Route path="/graph-view" element={<GraphView />} />
                  </Route>
                </Route>
                <Route element={<RequireNotAuth />}>
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/register" element={<Register />} />
                </Route>
              </Routes>
            </Box>
          </Router>
        </SnackbarProvider>
      </AuthContextProvider>
    </ThemeModeProvider>
  );
}

export default App;
