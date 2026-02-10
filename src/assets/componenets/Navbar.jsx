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
    <nav className="bg-white shadow-md py-4 px-6">
      <div className="mx-auto flex items-center justify-between">
        <img src="/imgs/navbarlogo.svg" alt="Logo" className="h-12" />

        {user && (
          <div className="flex  items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-gray-600">Welcome back,</p>
              <p className="text-sm md:text-lg font-semibold text-gray-800">
                {user.name}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-2 md:px-6 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
