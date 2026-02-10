import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";

const ShowVou = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchVouchers = async () => {
    try {
      const res = await api.get("/vouchers");

      if (res.data.success) {
        setVouchers(res.data.data);
      } else if (Array.isArray(res.data)) {
        setVouchers(res.data);
      } else {
        setVouchers([]);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load vouchers");
      setLoading(false);
    }
  };

  const deleteVoucher = async (id) => {
    if (!window.confirm("Are you sure you want to delete this voucher?")) {
      return;
    }

    try {
      const res = await api.delete(
        `https://bacendrepobaitusslamvouapp-production.up.railway.app/delete-voucher/${id}`,
      );

      if (res.data.success || res.data.message) {
        alert(res.data.message || "Voucher deleted successfully");
        fetchVouchers();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete voucher");
    }
  };

  // Navigate to cards view
  const viewCards = (id) => {
    navigate(`/voucher-cards/${id}`);
  };

  // Calculate statistics
  const getStatistics = () => {
    const totalVouchers = vouchers.length;
    const totalCards = vouchers.reduce((sum, v) => sum + v.totalCards, 0);
    const activeCards = vouchers.reduce(
      (sum, v) => sum + v.cards.filter((c) => c.status === "active").length,
      0,
    );

    return { totalVouchers, totalCards, activeCards };
  };

  // Get card counts for a voucher
  const getCardCounts = (voucher) => {
    const activeCards = voucher.cards.filter(
      (c) => c.status === "active",
    ).length;
    const usedCards = voucher.cards.filter((c) => c.status === "used").length;
    return { activeCards, usedCards };
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchVouchers();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading vouchers...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  // Statistics cards configuration
  const stats = getStatistics();
  const statCards = [
    {
      label: "Total Issuance Vouchers",
      value: stats.totalVouchers,
    },
    {
      label: "Total Cards",
      value: stats.totalCards,
    },
    {
      label: "Active Cards",
      value: stats.activeCards,
    },
  ];

  // Table columns configuration
  const columns = [
    { key: "shopName", label: "Shop Name" },
    { key: "discount", label: "Discount %" },
    { key: "applicableOn", label: "Discount Type" },
    { key: "expiryDate", label: "Expiry Date" },
    { key: "totalCards", label: "Total Issues Cards" },
    { key: "active", label: "Active Cards" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <div className="p-6">
      {vouchers.length === 0 ? (
        <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-600 text-xl font-semibold">
            No vouchers found
          </p>
          <p className="text-gray-500 mt-2">
            Create your first voucher to get started!
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shadow-lg shadow-black-500/50 ">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className={` rounded-lg p-6 shadow-lg shadow-black-500/50 `}
              >
                <p className="text-xl font-bold opacity-90">{stat.label}</p>
                <p className="text-5xl font-bold mt-2">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Vouchers Table */}
          <div className="bg-white rounded-lg shadow-lg  shadow-black-500/50">
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-400 border-collapse font-2xl  ">
                <thead className="text-xl font-extrabold bg-gray-100">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={`border border-gray-400 p-4 font-semibold ${
                          ["totalCards", "active", "actions"].includes(col.key)
                            ? "text-center"
                            : "text-left"
                        }`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {vouchers.map((voucher, index) => {
                    const { activeCards, usedCards } = getCardCounts(voucher);

                    return (
                      <tr key={voucher._id} className="hover:bg-gray-50">
                        <td className="border border-gray-400 p-4 font-semibold">
                          {voucher.shopName}
                        </td>

                        <td className="border border-gray-400 p-4">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded font-bold">
                            {voucher.discountPercentage}%
                          </span>
                        </td>

                        <td className="border border-gray-400 p-4">
                          {voucher.discountType === "specific_tests" ? (
                            <>
                              <div className="text-sm font-semibold text-blue-700">
                                Specific Tests
                              </div>
                              <div className="text-xs text-gray-600">
                                {voucher.specificTests.join(", ")}
                              </div>
                            </>
                          ) : (
                            <span className="text-sm font-semibold text-purple-700">
                              All Tests
                            </span>
                          )}
                        </td>

                        <td className="border border-gray-400 p-4">
                          {new Date(voucher.expiryDate).toLocaleDateString()}
                        </td>

                        <td className="border border-gray-400 p-4 text-center font-bold">
                          {voucher.totalCards}
                        </td>

                        <td className="border border-gray-400 p-4 text-center">
                          <div className="font-bold text-green-600">
                            {activeCards}
                          </div>
                          <div className="text-xs text-gray-500">
                            ({usedCards} used)
                          </div>
                        </td>

                        <td className="border border-gray-400 p-4">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => viewCards(voucher._id)}
                              className="px-3 py-2 bg-blue-500 text-white rounded"
                            >
                              View
                            </button>
                            <button
                              onClick={() => deleteVoucher(voucher._id)}
                              className="px-3 py-2 bg-red-500 text-white rounded"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ShowVou;
