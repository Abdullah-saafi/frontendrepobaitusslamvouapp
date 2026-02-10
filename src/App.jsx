import { BrowserRouter } from "react-router-dom";
import Routers from "./assets/Layouts/Routers";
import { AuthProvider } from "./assets/context/AuthContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="main bg-white">
          <Routers />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
