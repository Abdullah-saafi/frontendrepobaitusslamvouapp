import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const LoginComp = () => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If user is already logged in, redirect to appropriate page
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "lab_tech") {
        navigate("/labTech");
      }
    }
  }, [user, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(
  "http://localhost:5000/login",
  data,
  { withCredentials: true }
);

      // Store token and user data
      login(response.data, response.data.token);

      // Navigate based on role
      if (response.data.role === "admin") {
        navigate("/admin");
      } else if (response.data.role === "lab_tech") {
        navigate("/labTech");
      } else {
        setError("Invalid role");
      }
    } catch (err) {
      console.error("Login failed", err);
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-w-full ">
      <h2 className="text-2xl font-bold  md:py-10">
        Assalam-o-alaikum <br /> Please{" "}
        <span className="text-blue-900 text-3xl sm:text-5xl font-extrabold">
          {" "}
          Login
        </span>
      </h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6 w-full py-4 "
      >
        <input
          {...register("email")}
          type="email"
          placeholder="Email"
          required
          className="p-2 md:p-4 border border-gray-300 rounded-2xl text-md md:text-xl "
        />
        <input
          {...register("password")}
          type="password"
          placeholder="Password"
          required
          className="p-2 md:p-4 border border-gray-300 rounded-2xl text-md md:text-xl"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-2xl disabled:opacity-50 w-[30%] sm:w-[40] self-center sm:self-start"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default LoginComp;
