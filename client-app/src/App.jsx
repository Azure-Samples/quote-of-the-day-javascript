// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ContextProvider } from "./pages/AppContext";
import Layout from "./Layout";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";


function App() {
  return (
    <ContextProvider>
      <Router>
      <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </Layout>
      </Router>
    </ContextProvider>
  );
}

export default App;
