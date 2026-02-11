import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import QRCode from "react-qr-code";
import { useAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";

const ShowVouLabTech = () => {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyScans();
  }, []);

  const fetchMyScans = async () => {
    try {
      setLoading(true);
      const res = await api.get("/vouchers");

      const myScans = [];

      res.data.forEach((voucher) => {
        voucher.cards.forEach((card) => {
          if (
            card.status === "used" &&
            card.usedBy === user?.name &&
            card.usedAt
          ) {
            myScans.push({
              ...card,
              shopName: voucher.shopName,
              branch: `${voucher.idName} - ${voucher.partnerArea}`,
              discount: voucher.discountPercentage,
            });
          }
        });
      });

      myScans.sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt));
      setScans(myScans);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Date filter
  const filteredScans = scans.filter((card) => {
    const usedDate = new Date(card.usedAt);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (dateRange === "today") {
      return usedDate >= startOfToday;
    }

    if (dateRange === "yesterday") {
      const yesterday = new Date(startOfToday);
      yesterday.setDate(yesterday.getDate() - 1);
      return usedDate >= yesterday && usedDate < startOfToday;
    }

    if (dateRange === "last10days") {
      const tenDaysAgo = new Date(startOfToday);
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      return usedDate >= tenDaysAgo;
    }

    return true; // all
  });

  // 🔹 Export to Excel
  const exportToExcel = () => {
    const data = filteredScans.map((card, index) => ({
      "#": index + 1,
      "Shop Name": card.shopName,
      "Branch": card.branch,
      "Card Number": card.cardNumber,
      "Discount (%)": card.discount,
      "Scanned At": new Date(card.usedAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "My Scans");

    XLSX.writeFile(workbook, "My_Voucher_Scans.xlsx");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-2xl font-bold text-green-600">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 bg-red-100 rounded">{error}</div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Voucher Scans</h2>

      {/* 🔹 Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="all">All</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last10days">Last 10 Days</option>
        </select>

        <button
          onClick={exportToExcel}
          disabled={filteredScans.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-300"
        >
          Download Excel
        </button>
      </div>

      {filteredScans.length === 0 ? (
        <p className="text-gray-500">No scans found</p>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full border">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-3 border">#</th>
                <th className="p-3 border">Shop</th>
                <th className="p-3 border">Branch</th>
                <th className="p-3 border">Card</th>
                <th className="p-3 border">QR</th>
                <th className="p-3 border">Discount</th>
                <th className="p-3 border">Date</th>
              </tr>
            </thead>

            <tbody>
              {filteredScans.map((card, index) => (
                <tr key={card.cardNumber} className="hover:bg-gray-50">
                  <td className="p-3 border text-center">{index + 1}</td>
                  <td className="p-3 border">{card.shopName}</td>
                  <td className="p-3 border">{card.branch}</td>
                  <td className="p-3 border ">{card.cardNumber}</td>
                  <td className="p-1  flex justify-center">
                    <QRCode value={card.qrCode} size={50} />
                  </td>
                  <td className="p-3 border text-center font-bold">
                    {card.discount}%
                  </td>
                  <td className="p-3 border text-sm">
                    {new Date(card.usedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ShowVouLabTech;
