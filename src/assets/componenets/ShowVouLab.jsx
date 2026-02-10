import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import QRCode from "react-qr-code";
import * as XLSX from "xlsx";

const ShowVouLabTech = () => {
  const [vouchers, setVouchers] = useState([]);
  const [filters, setFilters] = useState({
    shopName: "",
    qrNumber: "",
    expiryDate: "",
    discountType: "",
    discountPercentage: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/vouchers");
      setVouchers(res.data);
      setError("");
    } catch (err) {
      setError("Failed to load vouchers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      shopName: "",
      qrNumber: "",
      expiryDate: "",
      discountType: "",
      discountPercentage: "",
    });
  };

  const getShopList = () => {
    const shops = [...new Set(vouchers.map((v) => v.shopName))];
    return shops.sort();
  };

  const getDiscountTypes = () => {
    const types = [...new Set(vouchers.map((v) => v.discountType))];
    return types.filter(Boolean).sort();
  };

  const getDiscountPercentages = () => {
    const percentages = [...new Set(vouchers.map((v) => v.discountPercentage))];
    return percentages.filter(Boolean).sort((a, b) => a - b);
  };

  const getFilteredCards = () => {
    const allCards = [];

    vouchers.forEach((voucher) => {
      voucher.cards.forEach((card) => {
        allCards.push({
          ...card,
          shopName: voucher.shopName,
          discount: voucher.discountPercentage,
          expiryDate: voucher.expiryDate,
          discountType: voucher.discountType,
          specificTests: voucher.specificTests,
        });
      });
    });

    let filtered = allCards;

    // Apply shop name filter
    if (filters.shopName) {
      filtered = filtered.filter((card) => card.shopName === filters.shopName);
    }

    // Apply QR number filter
    if (filters.qrNumber.trim()) {
      filtered = filtered.filter((card) =>
        card.cardNumber
          .toLowerCase()
          .includes(filters.qrNumber.toLowerCase().trim()),
      );
    }

    // Apply expiry date filter
    if (filters.expiryDate) {
      filtered = filtered.filter((card) => {
        const cardExpiry = new Date(card.expiryDate)
          .toISOString()
          .split("T")[0];
        return cardExpiry === filters.expiryDate;
      });
    }

    // Apply discount type filter
    if (filters.discountType) {
      filtered = filtered.filter(
        (card) => card.discountType === filters.discountType,
      );
    }

    // Apply discount percentage filter
    if (filters.discountPercentage) {
      filtered = filtered.filter(
        (card) => card.discount === parseInt(filters.discountPercentage),
      );
    }

    return filtered;
  };

  const exportToExcel = () => {
    const allFilteredCards = getFilteredCards();

    // Prepare data for Excel
    const excelData = allFilteredCards.map((card, index) => ({
      "#": index + 1,
      "Shop Name": card.shopName,
      "Card Number": card.cardNumber,
      "QR Code": card.qrCode,
      "Discount (%)": card.discount,
      "Discount Type": card.discountType || "-",
      "Expiry Date": card.expiryDate
        ? new Date(card.expiryDate).toLocaleDateString()
        : "-",
      Status: card.status,
      "Used By": card.usedBy || "-",
      "Used At": card.usedAt ? new Date(card.usedAt).toLocaleDateString() : "-",
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Voucher Cards");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `Voucher_Cards_${timestamp}.xlsx`;

    // Export file
    XLSX.writeFile(workbook, filename);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-3xl text-red-600">
          Say Subhan Allah Until Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
      </div>
    );
  }

  const shopList = getShopList();
  const discountTypes = getDiscountTypes();
  const discountPercentages = getDiscountPercentages();
  const allFilteredCards = getFilteredCards();

  // Pagination logic
  const totalPages = Math.ceil(allFilteredCards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayCards = allFilteredCards.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="p-6 mb-10">
      <h2 className="text-3xl font-bold mb-4 text-gray-800">
        Show All Voucher Cards
      </h2>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-700">Search Filters</h3>
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              disabled={allFilteredCards.length === 0}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Export to Excel
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Shop Name Filter */}
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

          {/* QR/Card Number Filter */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Card/QR Number
            </label>
            <input
              type="text"
              value={filters.qrNumber}
              onChange={(e) => handleFilterChange("qrNumber", e.target.value)}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Search card number..."
            />
          </div>

          {/* Expiry Date Filter */}
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

          {/* Discount Type Filter */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Discount Type
            </label>
            <select
              value={filters.discountType}
              onChange={(e) =>
                handleFilterChange("discountType", e.target.value)
              }
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- All Types --</option>
              {discountTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Discount Percentage Filter */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Discount Percentage
            </label>
            <select
              value={filters.discountPercentage}
              onChange={(e) =>
                handleFilterChange("discountPercentage", e.target.value)
              }
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- All Discounts --</option>
              {discountPercentages.map((percentage) => (
                <option key={percentage} value={percentage}>
                  {percentage}%
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="mt-4 text-sm text-gray-600">
          <strong>Results:</strong> {allFilteredCards.length} card(s) found
        </div>
      </div>

      {/* Results Table */}
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
                  <th className="border border-gray-400 p-3 text-center">#</th>
                  <th className="border border-gray-400 p-3 text-left">
                    Shop Name
                  </th>
                  <th className="border border-gray-400 p-3 text-left">
                    Card No
                  </th>
                  <th className="border border-gray-400 p-3 text-center">QR</th>
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
                      {card.shopName}
                    </td>

                    <td className="border border-gray-400 p-3 font-mono">
                      {card.cardNumber}
                    </td>

                    <td className="border border-gray-400 p-3 flex justify-center">
                      <QRCode value={card.qrCode} size={70} />
                    </td>

                    <td className="border border-gray-400 p-3 text-center font-semibold">
                      {card.discount}%
                    </td>

                    <td className="border border-gray-400 p-3 text-center">
                      {card.discountType || "-"}
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

          {/* Pagination Controls */}
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
  );
};

export default ShowVouLabTech;
