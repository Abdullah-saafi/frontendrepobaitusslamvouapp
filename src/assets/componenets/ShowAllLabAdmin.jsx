import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import * as XLSX from "xlsx";

const ShowAllCardAdmin = () => {
  const [vouchers, setVouchers] = useState([]);
  const [selectedLabTech, setSelectedLabTech] = useState("");
  const [dateRange, setDateRange] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVouchers();
  }, []);

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

  const getAllUsedCards = () => {
    const usedCards = [];
    vouchers.forEach((voucher) => {
      voucher.cards.forEach((card) => {
        if (card.status === "used" && card.usedBy && card.usedAt) {
          usedCards.push({
            ...card,
            shopName: voucher.shopName,
            discount: voucher.discountPercentage,
          });
        }
      });
    });
    return usedCards;
  };

  const getLabTechs = () => {
    const allCards = getAllUsedCards();
    const techs = [...new Set(allCards.map((card) => card.usedBy))];
    return techs.filter(Boolean).sort();
  };

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

        case "all":
          return true;

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

  const getLabTechSummary = () => {
    const allCards = getAllUsedCards();
    let filteredCards = filterByDateRange(allCards);

    if (selectedLabTech) {
      filteredCards = filteredCards.filter(
        (card) => card.usedBy === selectedLabTech,
      );
    }

    const techMap = {};

    filteredCards.forEach((card) => {
      if (!techMap[card.usedBy]) {
        techMap[card.usedBy] = {
          name: card.usedBy,
          totalScans: 0,
          totalDiscount: 0,
          shops: new Set(),
          scans: [],
        };
      }

      techMap[card.usedBy].totalScans++;
      techMap[card.usedBy].totalDiscount += card.discount;
      techMap[card.usedBy].shops.add(card.shopName);
      techMap[card.usedBy].scans.push(card);
    });

    return Object.values(techMap)
      .map((tech) => ({
        ...tech,
        shopCount: tech.shops.size,
        shops: Array.from(tech.shops).join(", "),
        scans: tech.scans.sort(
          (a, b) => new Date(b.usedAt) - new Date(a.usedAt),
        ),
      }))
      .sort((a, b) => b.totalScans - a.totalScans);
  };

  const exportAllToExcel = () => {
    const summary = getLabTechSummary();

    const excelData = [];

    summary.forEach((tech) => {
      tech.scans.forEach((scan, index) => {
        excelData.push({
          "Lab Technician": tech.name,
          "Scan #": index + 1,
          "Shop Name": scan.shopName,
          "Card Number": scan.cardNumber,
          Discount: scan.discount + "%",
          "Scanned Date": new Date(scan.usedAt).toLocaleDateString(),
          "Scanned Time": new Date(scan.usedAt).toLocaleTimeString(),
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All Lab Techs");

    const timestamp = new Date().toISOString().split("T")[0];
    const techName = selectedLabTech ? `_${selectedLabTech}` : "_All";
    const filename = `Lab_Tech_Report${techName}_${dateRange}_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  const exportSingleTechToExcel = (tech) => {
    const excelData = tech.scans.map((scan, index) => ({
      "Scan #": index + 1,
      "Shop Name": scan.shopName,
      "Card Number": scan.cardNumber,
      Discount: scan.discount + "%",
      "Scanned Date": new Date(scan.usedAt).toLocaleDateString(),
      "Scanned Time": new Date(scan.usedAt).toLocaleTimeString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, tech.name);

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${tech.name}_Report_${dateRange}_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
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

  const labTechs = getLabTechs();
  const labTechSummary = getLabTechSummary();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Lab Technician Activity Report
      </h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Search Lab Technician
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

          <div>
            <label className="block text-sm font-semibold mb-2">
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
              <option value="all">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === "custom" && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-2">
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
                <label className="block text-sm font-semibold mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            <button
              onClick={exportAllToExcel}
              disabled={labTechSummary.length === 0}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
            >
              Export All to Excel
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <strong>Found:</strong> {labTechSummary.length} lab technician(s) with
          activity
        </div>
      </div>

      {labTechSummary.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No data found for selected filters</p>
        </div>
      ) : (
        <div className="space-y-6">
          {labTechSummary.map((tech) => (
            <div key={tech.name} className="bg-white rounded-lg shadow">
              <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">{tech.name}</h2>
                  <p className="text-sm text-blue-100">
                    {tech.totalScans} scans • {tech.shopCount} shops •{" "}
                    {tech.totalDiscount}% total discount
                  </p>
                </div>
                <button
                  onClick={() => exportSingleTechToExcel(tech)}
                  className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-50 font-semibold"
                >
                  Download Excel
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-3 text-left">#</th>
                      <th className="border p-3 text-left">Shop Name</th>
                      <th className="border p-3 text-left">Card Number</th>
                      <th className="border p-3 text-center">Discount</th>
                      <th className="border p-3 text-left">Scanned At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tech.scans.map((scan, index) => (
                      <tr key={scan.cardNumber} className="hover:bg-gray-50">
                        <td className="border p-3">{index + 1}</td>
                        <td className="border p-3 font-medium">
                          {scan.shopName}
                        </td>
                        <td className="border p-3 font-mono text-sm">
                          {scan.cardNumber}
                        </td>
                        <td className="border p-3 text-center">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
                            {scan.discount}%
                          </span>
                        </td>
                        <td className="border p-3">
                          <div className="text-sm">
                            {new Date(scan.usedAt).toLocaleDateString("en-GB")}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(scan.usedAt).toLocaleTimeString("en-US", {
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShowAllCardAdmin;
