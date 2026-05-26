import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Review from "./pages/Review";
import Audit from "./pages/Audit";
import Login from "./pages/Login";
import Guide from "./pages/Guide";

import { useAuthStore } from "./store/authStore";

function ProtectedRoutes() {

  const { user } = useAuthStore();

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>

      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/upload"
          element={<Upload />}
        />

        <Route
          path="/review"
          element={<Review />}
        />

        <Route
          path="/audit"
          element={<Audit />}
        />

        <Route
          path="/guide"
          element={<Guide />}
        />

        <Route
          path="*"
          element={<Navigate to="/" />}
        />

      </Routes>

    </Layout>
  );
}

export default function App() {

  return (

    <Router>

      <ProtectedRoutes />

    </Router>

  );
}