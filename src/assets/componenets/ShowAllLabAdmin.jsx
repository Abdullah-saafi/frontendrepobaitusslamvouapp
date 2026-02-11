import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import QRCode from "react-qr-code";
import * as XLSX from "xlsx";

const ShowAllCardAdmin = () => {
  const [vouchers, setVouchers] = useState([]);
  const [selectedLabTech, setSelectedLabTech] = useState("");
  const [dateRange, setDateRange] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchVouchers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLabTech, dateRange, customStartDate, customEndDate]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/vouchers");
      setVouchers(res.data);
      setError("");
    } catch (err) {
      setError("Failed to load voucher data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get all used cards with lab tech info
  const getAllUsedCards = () => {
    const usedCards = [];
    vouchers.forEach((voucher) => {
      voucher.cards.forEach((card) => {
        if (card.status === "used" && card.usedBy && card.usedAt) {
          usedCards.push({
            ...card,
            shopName: voucher.shopName,
            idName: voucher.idName,
            partnerArea: voucher.partnerArea,
            discount: voucher.discountPercentage,
            discountType: voucher.discountType,
            expiryDate: voucher.expiryDate,
          });
        }
      });
    });
    return usedCards;
  };

  // Get unique lab tech names
  const getLabTechs = () => {
    const allUsedCards = getAllUsedCards();
    const labTechs = [...new Set(allUsedCards.map((card) => card.usedBy))];
    return labTechs.filter(Boolean).sort();
  };

  // Filter cards by date range
  const filterByDateRange = (cards) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return cards.filter((card) => {
      const usedDate = new Date(card.usedAt);

      switch (dateRange) {
        case "today":
          return usedDate >= today;

        case "yesterday": {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return usedDate >= yesterday && usedDate < today;
        }

        case "last7days": {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return usedDate >= sevenDaysAgo;
        }

        case "last10days": {
          const tenDaysAgo = new Date(today);
          tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
          return usedDate >= tenDaysAgo;
        }

        case "last30days": {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return usedDate >= thirtyDaysAgo;
        }

        case "custom": {
          if (!customStartDate || !customEndDate) return true;
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          return usedDate >= start && usedDate <= end;
        }

        default:
          return true;
      }
    });
  };

  // Get filtered scans
  const getFilteredScans = () => {
    let filtered = getAllUsedCards();

    // Filter by date range
    filtered = filterByDateRange(filtered);

    // Filter by lab tech
    if (selectedLabTech) {
      filtered = filtered.filter((card) => card.usedBy === selectedLabTech);
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt));

    return filtered;
  };

  // Calculate statistics for a specific lab tech
  const getLabTechStats = (labTechName, cards) => {
    const techCards = cards.filter((card) => card.usedBy === labTechName);
    const shops = [...new Set(techCards.map((card) => card.shopName))];

    return {
      totalScans: techCards.length,
      shops: shops,
      totalDiscount: techCards.reduce((sum, card) => sum + (card.discount || 0), 0),
    };
  };

  // Get summary for all lab techs
  const getLabTechSummary = () => {
    const filteredCards = filterByDateRange(getAllUsedCards());
    const labTechs = getLabTechs();

    return labTechs.map((labTech) => {
      const stats = getLabTechStats(labTech, filteredCards);
      return {
        name: labTech,
        ...stats,
      };
    });
  };

  // Export to Excel
  const exportToExcel = () => {
    const filteredScans = getFilteredScans();

    const excelData = filteredScans.map((card, index) => ({
      "#": index + 1,
      "Lab Tech": card.usedBy,
      "Shop Name": card.shopName,
      "Branch": `${card.idName} - ${card.partnerArea}`,
      "Card Number": card.cardNumber,
      "Discount (%)": card.discount,
      "Scanned At": new Date(card.usedAt).toLocaleString(),
      "Scanned Date": new Date(card.usedAt).toLocaleDateString(),
      "Scanned Time": new Date(card.usedAt).toLocaleTimeString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Lab Tech Scans");

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `Lab_Tech_Scans_${dateRange}_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-3xl text-green-600 font-bold">
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

  const labTechs = getLabTechs();
  const labTechSummary = getLabTechSummary();
  const filteredScans = getFilteredScans();

  // Pagination
  const totalPages = Math.ceil(filteredScans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayScans = filteredScans.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="p-6 mb-10">

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-700 mb-4">Filters</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Lab Tech Filter */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Lab Technician
            </label>
            <select
              value={selectedLabTech}
              onChange={(e) => setSelectedLabTech(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- All Lab Techs --</option>
              {labTechs.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last10days">Last 10 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Export Button */}
          <div className="flex items-end">
            <button
              onClick={exportToExcel}
              disabled={filteredScans.length === 0}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Export to Excel
            </button>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateRange === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <strong>Total Scans:</strong> {filteredScans.length}
        </div>
      </div>

      {/* Lab Tech Summary Cards */}
      {!selectedLabTech && labTechSummary.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-700 mb-4">
            Lab Tech Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {labTechSummary.map((tech) => (
              <div
                key={tech.name}
                className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4 shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => setSelectedLabTech(tech.name)}
              >
                <h4 className="font-bold text-lg text-gray-800 mb-2">
                  {tech.name}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Scans:</span>
                    <span className="font-semibold text-blue-600">
                      {tech.totalScans}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shops Covered:</span>
                    <span className="font-semibold text-green-600">
                      {tech.shops.length}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <p className="text-xs text-gray-500">
                      Shops: {tech.shops.join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scan Details Table */}
      {filteredScans.length === 0 ? (
        <p className="text-center text-gray-500 bg-white p-8 rounded shadow">
          No scans found for the selected filters
        </p>
      ) : (
        <>
          <div className="bg-white rounded shadow overflow-x-auto">
            <table className="w-full border border-gray-400 border-collapse">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="border border-gray-400 p-3 text-center">#</th>
                  <th className="border border-gray-400 p-3 text-left">
                    Lab Tech
                  </th>
                  <th className="border border-gray-400 p-3 text-left">
                    Shop Name
                  </th>
                  <th className="border border-gray-400 p-3 text-left">
                    Branch
                  </th>
                  <th className="border border-gray-400 p-3 text-left">
                    Card Number
                  </th>
                  <th className="border border-gray-400 p-3 text-center">
                    QR Code
                  </th>
                  <th className="border border-gray-400 p-3 text-center">
                    Discount
                  </th>
                  <th className="border border-gray-400 p-3 text-left">
                    Scanned At
                  </th>
                </tr>
              </thead>

              <tbody>
                {displayScans.map((card, index) => (
                  <tr key={card.cardNumber} className="hover:bg-gray-50">
                    <td className="border border-gray-400 p-3 text-center font-bold">
                      {startIndex + index + 1}
                    </td>

                    <td className="border border-gray-400 p-3">
                      <span className="font-semibold text-blue-600">
                        {card.usedBy}
                      </span>
                    </td>

                    <td className="border border-gray-400 p-3">
                      {card.shopName}
                    </td>

                    <td className="border border-gray-400 p-3 text-sm">
                      {card.idName} - {card.partnerArea}
                    </td>

                    <td className="border border-gray-400 p-3 font-mono text-sm">
                      {card.cardNumber}
                    </td>

                    <td className="border border-gray-400 p-3">
                      <div className="flex justify-center">
                        <QRCode value={card.qrCode} size={60} />
                      </div>
                    </td>

                    <td className="border border-gray-400 p-3 text-center">
                      <span className="font-semibold text-green-600">
                        {card.discount}%
                      </span>
                    </td>

                    <td className="border border-gray-400 p-3 text-sm">
                      <div>
                        {new Date(card.usedAt).toLocaleDateString("en-GB")}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(card.usedAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded shadow gap-4">
              <div className="text-gray-600">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredScans.length)} of{" "}
                {filteredScans.length} scans
              </div>

              <div className="flex gap-2">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="px-4 py-2 bg-gray-100 rounded font-semibold">
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
          )}
        </>
      )}
    </div>
  );
};

export default ShowAllCardAdmin;