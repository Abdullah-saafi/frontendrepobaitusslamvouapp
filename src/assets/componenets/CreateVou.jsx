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

  // ── image state ───────────────────────────────────────────────────────────
  const [partnerImage, setPartnerImage] = useState(null);
  const [partnerImagePreview, setPartnerImagePreview] = useState(null);
  // ─────────────────────────────────────────────────────────────────────────

  const discountType = watch("discountType");
  const discountPercentage = watch("discountPercentage");

  const addTestField = () => setSpecificTests([...specificTests, ""]);

  const removeTestField = (index) =>
    setSpecificTests(specificTests.filter((_, i) => i !== index));

  const handleTestChange = (index, value) => {
    const updated = [...specificTests];
    updated[index] = value;
    setSpecificTests(updated);
  };

  // ── image handlers ────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (partnerImagePreview) URL.revokeObjectURL(partnerImagePreview);
    setPartnerImage(file);
    setPartnerImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (partnerImagePreview) URL.revokeObjectURL(partnerImagePreview);
    setPartnerImage(null);
    setPartnerImagePreview(null);
  };
  // ─────────────────────────────────────────────────────────────────────────

  const onSubmit = async (data) => {
    try {
      // FormData so the image file travels alongside the text fields
      const formData = new FormData();

      // Append all scalar fields from react-hook-form
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) formData.append(key, val);
      });

      // specificTests must be a JSON string — controller parses it back
      formData.append(
        "specificTests",
        JSON.stringify(
          data.discountType === "specific_tests"
            ? specificTests.filter((t) => t.trim())
            : [],
        ),
      );

      // Attach image only if the user picked one
      if (partnerImage) formData.append("partnerImage", partnerImage);

      const response = await api.post("/create-voucher", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(response.data.message);
      setError("");
      setCreatedVoucher(response.data.voucher);
      reset();
      setSpecificTests([""]);
      setPartnerImage(null);
      setPartnerImagePreview(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create voucher");
      setMessage("");
      setCreatedVoucher(null);
    }
  };

  const viewCards = (id) => navigate(`/voucher-cards/${id}`);

  const createAnother = () => {
    setCreatedVoucher(null);
    setMessage("");
    setError("");
  };

  const formFields = [
    {
      name: "voucherName",
      label: "Voucher Name",
      type: "text",
      placeholder: "e.g., Ramzan Voucher, Summer Vou...",
    },
    {
      name: "shopName",
      label: "Partner Name",
      type: "text",
      placeholder: "e.g., IMTIAZ, NAHEED",
    },
    {
      name: "partnerArea",
      label: "Partner Branch Area",
      type: "text",
      placeholder: "e.g., Imtiaz(IMT), j.jamsheed(J.)",
    },
    {
      name: "idName",
      label: "Partner Branch Code",
      type: "text",
      placeholder: "e.g., 201",
    },
    {
      name: "discountType",
      label: "Discount On",
      type: "select",
      options: [
        { value: "", label: "Select discounts on" },
        { value: "all_tests", label: "All Tests" },
        { value: "specific_tests", label: "Specific Tests" },
      ],
    },
    {
      name: "discountPercentage",
      label: "Discount Type",
      type: "select",
      options: [
        { value: "", label: "Select discounts Type" },
        { value: "percentage", label: "Percentage (%)" },
        { value: "rupee", label: "Rupee (PKR)" },
      ],
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
          className="bg-white rounded-lg shadow-lg sm:p-8 py-4 sm:py-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {/* ── Standard fields ── */}
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

            {/* ── Specific tests + discount value ── */}
            <div className="flex col-start-1 col-end-3 my-3">
              {discountType === "specific_tests" && (
                <div className="py-2 mr-10">
                  <label className="block text-xl font-semibold text-gray-700 mb-2">
                    Specific Tests <span className="text-red-500">*</span>
                  </label>
                  {specificTests.map((test, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        value={test}
                        required
                        onChange={(e) =>
                          handleTestChange(index, e.target.value)
                        }
                        placeholder="Test name (e.g., CBC, HEP.C)"
                        className="w-100 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
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

              {discountPercentage && discountPercentage !== "" && (
                <div className="py-2">
                  <label className="block text-xl font-semibold text-gray-700 mb-2">
                    Discount Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("discountValue")}
                    type="number"
                    min={1}
                    max={discountPercentage === "percentage" ? 100 : undefined}
                    placeholder={
                      discountPercentage === "percentage"
                        ? "e.g., 30, 50"
                        : "e.g., 500, 1000"
                    }
                    required
                    className="w-100 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              )}
            </div>

            {/* ── Partner / Card Image Upload ─────────────────────────────── */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <label className="block text-xl font-semibold text-gray-700 mb-2">
                Partner / Card Image{" "}
                <span className="text-gray-400 text-sm font-normal">
                  (optional — shown as background on every card)
                </span>
              </label>

              <div className="flex items-center gap-4 flex-wrap">
                <label className="cursor-pointer px-5 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition text-gray-500 hover:text-blue-500 text-sm font-medium select-none">
                  {partnerImage ? "Change Image" : "+ Upload Image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>

                {partnerImagePreview && (
                  <>
                    <img
                      src={partnerImagePreview}
                      alt="preview"
                      className="h-16 w-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                    />
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-600 font-medium truncate max-w-[180px]">
                        {partnerImage?.name}
                      </span>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="text-red-500 text-sm hover:underline text-left"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                )}
              </div>

              {partnerImagePreview && (
                <p className="text-xs text-gray-400 mt-2">
                  This image will appear as a subtle background on every card in
                  this voucher batch.
                </p>
              )}
            </div>
            {/* ─────────────────────────────────────────────────────────────── */}

            {/* ── Submit ── */}
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
        /* ── Success screen ── */
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
                {createdVoucher.discountPercentage === "percentage"
                  ? `${createdVoucher.discountValue}% OFF`
                  : `PKR ${createdVoucher.discountValue} OFF`}
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

            {/* Image confirmation */}
            {createdVoucher.partnerImageUrl && (
              <div className="col-span-1 md:col-span-2 flex items-center gap-3">
                <p className="text-gray-600 font-semibold">Card Image:</p>
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}${createdVoucher.partnerImageUrl}`}
                  alt="partner"
                  className="h-14 w-20 object-cover rounded-lg border border-gray-200"
                />
                <span className="text-green-600 text-sm font-medium">
                  ✓ Applied to all cards
                </span>
              </div>
            )}
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
