import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="text-5xl py-4 text-center  flex items-center justify-between px-15 shadow-lg shadow-black-500">
      <img src="/imgs/navbarlogo.svg" alt="" className="max-h-10" />
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold">Welcome, {user.name}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-4 rounded-full text-xl"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Navbar;
