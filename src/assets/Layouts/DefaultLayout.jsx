import { Outlet } from "react-router-dom";
import Navbar from "../componenets/Navbar";
import Footer from "../componenets/Footer";

const DefaultLayout = () => {
  return (
    <div className="main">
      <Navbar  />
      <Outlet />
      <Footer />
    </div>
  );
};

export default DefaultLayout;
