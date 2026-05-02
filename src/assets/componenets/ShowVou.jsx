import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import * as XLSX from "xlsx";

const ShowVou = () => {
  const [activeTab, setActiveTab] = useState("vouchers");
  const [vouchers, setVouchers] = useState([]);
  const [filters, setFilters] = useState({
    voucherName: "",
    shopName: "",
    qrNumber: "",
    expiryDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const navigate = useNavigate();

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/vouchers");
      if (res.data.success) {
        setVouchers(res.data.data);
      } else if (Array.isArray(res.data)) {
        setVouchers(res.data);
      } else {
        setVouchers([]);
      }
      setError("");
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load vouchers");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const deleteVoucher = async (id) => {
    if (!window.confirm("Are you sure you want to delete this voucher?"))
      return;
    try {
      const res = await api.delete(`/delete-voucher/${id}`);
      alert(res.data.message || "Voucher deleted successfully");
      fetchVouchers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete voucher");
    }
  };

  const viewCards = (id) => {
    navigate(`/voucher-cards/${id}`);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ voucherName: "", shopName: "", qrNumber: "", expiryDate: "" });
  };

  const getStatistics = () => {
    const totalVouchers = vouchers.length;
    const totalCards = vouchers.reduce((sum, v) => sum + v.totalCards, 0);
    const activeCards = vouchers.reduce(
      (sum, v) => sum + v.cards.filter((c) => c.status === "active").length,
      0,
    );
    return { totalVouchers, totalCards, activeCards };
  };

  const getCardCounts = (voucher) => {
    const activeCards = voucher.cards.filter(
      (c) => c.status === "active",
    ).length;
    const usedCards = voucher.cards.filter((c) => c.status === "used").length;
    return { activeCards, usedCards };
  };

  const getVoucherNames = () => {
    const names = [
      ...new Set(vouchers.map((v) => v.voucherName).filter(Boolean)),
    ];
    return names.sort();
  };

  const getShopList = () => {
    const shops = [...new Set(vouchers.map((v) => v.shopName))];
    return shops.sort();
  };

  const formatDiscount = (voucher) => {
    if (voucher.discountPercentage === "percentage") {
      return `${voucher.discountValue}%`;
    } else if (voucher.discountPercentage === "rupee") {
      return `PKR ${voucher.discountValue}`;
    }
    return `${voucher.discountPercentage}%`;
  };

  // ─── FILTERED VOUCHERS (for "All Vouchers" tab) ───────────────────────────
  const getFilteredVouchers = () => {
    let filtered = vouchers;

    if (filters.voucherName) {
      filtered = filtered.filter((v) => v.voucherName === filters.voucherName);
    }
    if (filters.shopName) {
      filtered = filtered.filter((v) => v.shopName === filters.shopName);
    }
    if (filters.expiryDate) {
      filtered = filtered.filter((v) => {
        const d = new Date(v.expiryDate).toISOString().split("T")[0];
        return d === filters.expiryDate;
      });
    }

    return filtered;
  };

  // ─── FILTERED CARDS (for "Specific Voucher Details" tab) ─────────────────
  const getFilteredCards = () => {
    const allCards = [];

    vouchers.forEach((voucher) => {
      voucher.cards.forEach((card) => {
        allCards.push({
          ...card,
          voucherName: voucher.voucherName || "N/A",
          shopName: voucher.shopName,
          discount: formatDiscount(voucher),
          expiryDate: voucher.expiryDate,
          discountType: voucher.discountType,
          specificTests: voucher.specificTests,
        });
      });
    });

    let filtered = allCards;

    if (filters.voucherName) {
      filtered = filtered.filter(
        (card) => card.voucherName === filters.voucherName,
      );
    }
    if (filters.shopName) {
      filtered = filtered.filter((card) => card.shopName === filters.shopName);
    }
    if (filters.qrNumber.trim()) {
      filtered = filtered.filter((card) =>
        card.cardNumber
          .toLowerCase()
          .includes(filters.qrNumber.toLowerCase().trim()),
      );
    }
    if (filters.expiryDate) {
      filtered = filtered.filter((card) => {
        const cardExpiry = new Date(card.expiryDate)
          .toISOString()
          .split("T")[0];
        return cardExpiry === filters.expiryDate;
      });
    }

    return filtered;
  };

  const exportToExcel = () => {
    const allFilteredCards = getFilteredCards();
    const excelData = allFilteredCards.map((card, index) => ({
      "#": index + 1,
      "Voucher Name": card.voucherName,
      "Shop Name": card.shopName,
      "Card Number": card.cardNumber,
      "QR Code": card.qrCode,
      Discount: card.discount,
      "Discount Type": card.discountType || "-",
      "Expiry Date": card.expiryDate
        ? new Date(card.expiryDate).toLocaleDateString()
        : "-",
      Status: card.status,
      "Used By": card.usedBy || "-",
      "Used At": card.usedAt ? new Date(card.usedAt).toLocaleDateString() : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Voucher Cards");
    const timestamp = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Voucher_Cards_${timestamp}.xlsx`);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading vouchers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  const stats = getStatistics();
  const statCards = [
    { label: "Total Issuance Vouchers", value: stats.totalVouchers },
    { label: "Total Cards", value: stats.totalCards },
    { label: "Active Cards", value: stats.activeCards },
  ];

  const columns = [
    { key: "voucherName", label: "Voucher Name" },
    { key: "shopName", label: "Shop Name" },
    { key: "discount", label: "Discount" },
    { key: "applicableOn", label: "Discount Type" },
    { key: "expiryDate", label: "Expiry Date" },
    { key: "totalCards", label: "Total Issues Cards" },
    { key: "active", label: "Active Cards" },
    { key: "actions", label: "Actions" },
  ];

  const voucherNames = getVoucherNames();
  const shopList = getShopList();
  const filteredVouchers = getFilteredVouchers();
  const allFilteredCards = getFilteredCards();

  const totalPages = Math.ceil(allFilteredCards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayCards = allFilteredCards.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // ─── Shared Filter Bar Component ─────────────────────────────────────────
  const FilterBar = ({ showQrFilter = false }) => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-700">Search Filters</h3>
        <div className="flex gap-2">
          {showQrFilter && (
            <button
              onClick={exportToExcel}
              disabled={allFilteredCards.length === 0}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Export to Excel
            </button>
          )}
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 gap-4 ${showQrFilter ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}
      >
        {/* Voucher Name */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Voucher Name
          </label>
          <select
            value={filters.voucherName}
            onChange={(e) => handleFilterChange("voucherName", e.target.value)}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- All Vouchers --</option>
            {voucherNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Shop Name */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Shop Name
          </label>
          <select
            value={filters.shopName}
            onChange={(e) => handleFilterChange("shopName", e.target.value)}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- All Shops --</option>
            {shopList.map((shop) => (
              <option key={shop} value={shop}>
                {shop}
              </option>
            ))}
          </select>
        </div>

        {/* QR / Card Number — only in cards tab */}
        {showQrFilter && (
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Card / QR Number
            </label>
            <input
              type="text"
              value={filters.qrNumber}
              onChange={(e) => handleFilterChange("qrNumber", e.target.value)}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Search card number..."
            />
          </div>
        )}

        {/* Expiry Date */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Expiry Date
          </label>
          <input
            type="date"
            value={filters.expiryDate}
            onChange={(e) => handleFilterChange("expiryDate", e.target.value)}
            className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <strong>Results:</strong>{" "}
        {showQrFilter
          ? `${allFilteredCards.length} card(s) found`
          : `${filteredVouchers.length} voucher(s) found`}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-300">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("vouchers")}
            className={`px-2 py-2 font-semibold text-lg transition-colors ${
              activeTab === "vouchers"
                ? "border-b-4 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            All Vouchers List
          </button>
          <button
            onClick={() => setActiveTab("cards")}
            className={`px-2 py-2 font-semibold text-lg transition-colors ${
              activeTab === "cards"
                ? "border-b-4 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            Specific Voucher Details
          </button>
        </div>
      </div>

      {/* ── VOUCHERS TAB ─────────────────────────────────────────────────── */}
      {activeTab === "vouchers" && (
        <div>
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
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shadow-lg shadow-black-500/50">
                {statCards.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg p-6 shadow-lg shadow-black-500/50"
                  >
                    <p className="text-xl font-bold opacity-90">{stat.label}</p>
                    <p className="text-5xl font-bold mt-2">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Filter Bar (no QR filter in vouchers tab) */}
              <FilterBar showQrFilter={false} />

              {filteredVouchers.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-10 text-center">
                  <p className="text-gray-500 text-lg">
                    No vouchers match the selected filters.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-lg shadow-black-500/50">
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-400 border-collapse text-base">
                      <thead className="text-xl font-extrabold bg-gray-100">
                        <tr>
                          {columns.map((col) => (
                            <th
                              key={col.key}
                              className={`border border-gray-400 p-4 font-semibold ${
                                ["totalCards", "active", "actions"].includes(
                                  col.key,
                                )
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
                        {filteredVouchers.map((voucher) => {
                          const { activeCards, usedCards } =
                            getCardCounts(voucher);
                          return (
                            <tr key={voucher._id} className="hover:bg-gray-50">
                              <td className="border border-gray-400 p-4 font-semibold">
                                {voucher.voucherName || "N/A"}
                              </td>
                              <td className="border border-gray-400 p-4 font-semibold">
                                {voucher.shopName}
                              </td>
                              <td className="border border-gray-400 p-4">
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded font-bold">
                                  {formatDiscount(voucher)}
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
                                {new Date(
                                  voucher.expiryDate,
                                ).toLocaleDateString()}
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
                                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => deleteVoucher(voucher._id)}
                                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
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
              )}
            </>
          )}
        </div>
      )}

      {/* ── CARDS TAB ────────────────────────────────────────────────────── */}
      {activeTab === "cards" && (
        <div className="mb-10">
          {/* Filter Bar (with QR filter) */}
          <FilterBar showQrFilter={true} />

          {allFilteredCards.length === 0 ? (
            <p className="text-center text-gray-500 bg-white p-8 rounded shadow">
              No cards found matching your filters
            </p>
          ) : (
            <>
              <div className="bg-white rounded shadow overflow-x-auto">
                <table className="w-full border border-gray-400 border-collapse">
                  <thead className="bg-blue-600 text-white text-xl">
                    <tr>
                      <th className="border border-gray-400 p-3 text-center">
                        #
                      </th>
                      <th className="border border-gray-400 p-3 text-left">
                        Voucher Name
                      </th>
                      <th className="border border-gray-400 p-3 text-left">
                        Shop Name
                      </th>
                      <th className="border border-gray-400 p-3 text-left">
                        Card No
                      </th>
                      <th className="border border-gray-400 p-3 text-center">
                        QR
                      </th>
                      <th className="border border-gray-400 p-3 text-center">
                        Discount
                      </th>
                      <th className="border border-gray-400 p-3 text-center">
                        Type
                      </th>
                      <th className="border border-gray-400 p-3 text-center">
                        Expiry
                      </th>
                      <th className="border border-gray-400 p-3 text-center">
                        Status
                      </th>
                      <th className="border border-gray-400 p-3 text-left">
                        Used By
                      </th>
                      <th className="border border-gray-400 p-3 text-left">
                        Used At
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayCards.map((card, index) => (
                      <tr key={card.cardNumber} className="hover:bg-gray-50">
                        <td className="border border-gray-400 p-3 text-center font-bold">
                          {startIndex + index + 1}
                        </td>
                        <td className="border border-gray-400 p-3">
                          {card.voucherName}
                        </td>
                        <td className="border border-gray-400 p-3">
                          {card.shopName}
                        </td>
                        <td className="border border-gray-400 p-3 font-mono">
                          {card.cardNumber}
                        </td>
                        <td className="border border-gray-400 p-3">
                          <div className="flex justify-center">
                            <QRCode value={card.qrCode} size={70} />
                          </div>
                        </td>
                        <td className="border border-gray-400 p-3 text-center font-semibold">
                          {card.discount}
                        </td>
                        <td className="border border-gray-400 p-3 text-center">
                          {card.discountType === "all_tests"
                            ? "All Tests"
                            : "Specific Tests"}
                        </td>
                        <td className="border border-gray-400 p-3 text-center">
                          {card.expiryDate
                            ? new Date(card.expiryDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="border border-gray-400 p-3 text-center">
                          <span
                            className={`px-3 py-1 rounded text-white text-xs ${
                              card.status === "active"
                                ? "bg-green-500"
                                : card.status === "used"
                                  ? "bg-gray-500"
                                  : "bg-red-500"
                            }`}
                          >
                            {card.status}
                          </span>
                        </td>
                        <td className="border border-gray-400 p-3">
                          {card.usedBy || "-"}
                        </td>
                        <td className="border border-gray-400 p-3">
                          {card.usedAt
                            ? new Date(card.usedAt).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex justify-between items-center bg-white p-4 rounded shadow">
                <div className="text-gray-600">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, allFilteredCards.length)} of{" "}
                  {allFilteredCards.length} cards
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="px-4 py-2 bg-gray-100 rounded">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ShowVou;
