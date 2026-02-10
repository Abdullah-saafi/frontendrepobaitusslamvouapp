import { Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import DefaultLayout from "./DefaultLayout";
import Admin from "../pages/Admin";
import LabTech from "../pages/LabTech";
import VoucherCards from "../componenets/VoucherCards";
import ProtectedRoute from "../componenets/ProtectedRoute";

const Routers = () => {
  return (
    <div className="main">
      <Routes>
        <Route element={<DefaultLayout />}>
          <Route path={"/"} element={< Home />}></Route>
          
          {/* Admin route - only accessible by admin */}
          <Route
            path={"/admin"}
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Admin/>
              </ProtectedRoute>
            }
          ></Route>
          
          {/* Lab Tech route - only accessible by lab_tech */}
          <Route
            path={"/labTech"}
            element={
              <ProtectedRoute allowedRoles={["lab_tech"]}>
                <LabTech />
              </ProtectedRoute>
            }
          ></Route>
          
          {/* Voucher cards - accessible by both admin and lab_tech */}
          <Route
            path="/voucher-cards/:id"
            element={
              <ProtectedRoute allowedRoles={["admin", "lab_tech"]}>
                <VoucherCards />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </div>
  );
};

export default Routers;
