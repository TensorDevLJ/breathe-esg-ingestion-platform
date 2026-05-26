import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Review from "./pages/Review";
import Audit from "./pages/Audit";

export default function App() {

  return (

    <Router>

      <Layout>

        <Routes>

          <Route path="/" element={<Dashboard />} />

          <Route path="/upload" element={<Upload />} />

          <Route path="/review" element={<Review />} />

          <Route path="/audit" element={<Audit />} />

          <Route path="*" element={<Navigate to="/" />} />

        </Routes>

      </Layout>

    </Router>

  )

}