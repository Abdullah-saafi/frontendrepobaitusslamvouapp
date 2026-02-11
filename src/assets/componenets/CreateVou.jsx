import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const CreateVou = () => {
  const { register, handleSubmit, watch, reset } = useForm();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [specificTests, setSpecificTests] = useState([""]);
  const [createdVoucher, setCreatedVoucher] = useState(null);

  const discountType = watch("discountType");

  const addTestField = () => {
    setSpecificTests([...specificTests, ""]);
  };

  const removeTestField = (index) => {
    setSpecificTests(specificTests.filter((_, i) => i !== index));
  };

  const handleTestChange = (index, value) => {
    const updated = [...specificTests];
    updated[index] = value;
    setSpecificTests(updated);
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        specificTests:
          data.discountType === "specific_tests"
            ? specificTests.filter((test) => test.trim())
            : [],
      };

      const response = await api.post("/create-voucher", payload);

      setMessage(response.data.message);
      setError("");
      setCreatedVoucher(response.data.voucher);
      reset();
      setSpecificTests([""]);
      alert("Voucher created successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create voucher");
      setMessage("");
      setCreatedVoucher(null);
    }
  };

  const viewCards = (id) => {
    navigate(`/voucher-cards/${id}`);
  };

  const createAnother = () => {
    setCreatedVoucher(null);
    setMessage("");
    setError("");
  };

  const formFields = [
    { name: "shopName", label: "Partner", type: "text" ,placeholder: "e.g., IMTIAZ, NAHEED",},
    { name: "partnerArea", label: "Branch Area", type: "text",placeholder: "e.g., Imtiaz(IMT), j.jamsheed(J.)", },
    { name: "idName", label: "Branch Code", type: "text", placeholder: "e.g., 201 ",},
    {
      name: "discountType",
      label: "Discount Type",
      type: "select",
      options: [
        { value: "", label: "Select Type" },
        { value: "all_tests", label: "Discount on All Tests" },
        { value: "specific_tests", label: "Discount on Specific Tests" },
      ],
    },
    {
      name: "discountPercentage",
      label: "Discount Percentage",
      type: "number",
      placeholder: "e.g., 30 for 30%",
      min: 1,
      max: 100,
    },
    { name: "expiryDate", label: "Expiry Date", type: "date" },
    {
      name: "totalCards",
      label: "Number of Cards",
      type: "number",
      placeholder: "e.g., 50",
      min: 1,
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

      {!createdVoucher ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-lg shadow-lg p sm:p-8 py-4 sm:py-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {formFields.map((field) => (
              <div key={field.name}>
                <label className="block text-xl font-semibold text-gray-700 mb-2">
                  {field.label} <span className="text-red-500">*</span>
                </label>
                {field.type === "select" ? (
                  <select
                    {...register(field.name)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    {...register(field.name)}
                    type={field.type}
                    min={field.min}
                    max={field.max}
                    placeholder={field.placeholder}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                )}
              </div>
            ))}

            {discountType === "specific_tests" && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <label className="block text-xl font-semibold text-gray-700 mb-2">
                  Specific Tests <span className="text-red-500">*</span>
                </label>
                {specificTests.map((test, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      value={test}
                      onChange={(e) => handleTestChange(index, e.target.value)}
                      placeholder="Test name (e.g., CBC, Lipid Profile)"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                    {specificTests.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestField(index)}
                        className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTestField}
                  className="mt-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  + Add Test
                </button>
              </div>
            )}

            <div className="mt-8 col-span-1 md:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition"
              >
                Create Voucher
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-2xl font-bold mb-4 text-green-700">
            Voucher Created Successfully!
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600 font-semibold">Shop Name:</p>
              <p className="text-lg">{createdVoucher.shopName}</p>
            </div>

            <div>
              <p className="text-gray-600 font-semibold">Discount:</p>
              <p className="text-lg font-bold text-green-600">
                {createdVoucher.discountPercentage}%
              </p>
            </div>

            <div>
              <p className="text-gray-600 font-semibold">Discount Type:</p>
              <p className="text-lg">
                {createdVoucher.discountType === "all_tests"
                  ? "All Tests"
                  : "Specific Tests"}
              </p>
            </div>

            {createdVoucher.discountType === "specific_tests" && (
              <div>
                <p className="text-gray-600 font-semibold">Tests:</p>
                <p className="text-lg">
                  {createdVoucher.specificTests.join(", ")}
                </p>
              </div>
            )}

            <div>
              <p className="text-gray-600 font-semibold">Expiry Date:</p>
              <p className="text-lg">
                {new Date(createdVoucher.expiryDate).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-gray-600 font-semibold">
                Total Cards Generated:
              </p>
              <p className="text-lg font-bold">{createdVoucher.cards.length}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => viewCards(createdVoucher._id)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition"
            >
              View & Download Cards
            </button>

            <button
              onClick={createAnother}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition"
            >
              Create Another Voucher
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateVou;
