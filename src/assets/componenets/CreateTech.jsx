import React, { useState } from "react";
import { useForm } from "react-hook-form";
import api from "../../utils/api";

const CreateStaffAdmin = () => {
  const { register, handleSubmit, reset, watch } = useForm();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (data) => {
    // Validate passwords match
    if (data.password !== data.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Remove confirmPassword before sending
      const { confirmPassword, ...techData } = data;
      const response = await api.post("/create-lab-tech", techData);

      setMessage(response.data.message);
      setError("");
      reset();
      alert("Lab Tech created successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create Lab Tech");
      setMessage("");
    }
  };

  const formFields = [
    {
      name: "name",
      label: "Name",
      type: "text",
      placeholder: "Enter full name",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "email@example.com",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "Enter password",
    },
    {
      name: "confirmPassword",
      label: "Confirm Password",
      type: "password",
      placeholder: "Re-enter password",
    },
    {
      name: "branchname",
      label: "Branch Name",
      type: "text",
      placeholder: "e.g., Maiir",
    },
    {
      name: "branchcode",
      label: "Branch Code",
      type: "number",
      placeholder: "e.g., 101",
    },
    {
      name: "contact",
      label: "Contact Number",
      type: "text",
      placeholder: "e.g., 03001234567",
    },
  ];

  return (
    <div className="p-4 w-full sm:w-[90%] flex flex-col gap-6 mx-auto my-5">
      {message && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-lg shadow-lg p sm:p-8 py-4 sm:py-10"
      >
        <div className="sm:grid  md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          {formFields.map((field) => (
            <div key={field.name}>
              <label className="block text-xl font-semibold text-gray-700 mb-2 ">
                {field.label} <span className="text-red-500 ">*</span>
              </label>
              <input
                {...register(field.name)}
                type={field.type}
                placeholder={field.placeholder}
                required
                className="w-full mb-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          ))}

          <div className="mt-8 col-span-2">
            <button
              type="submit"
              className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition duration-"
            >
              Create Staff
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateStaffAdmin;
