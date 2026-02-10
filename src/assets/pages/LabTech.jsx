import React, { useState } from "react";
import ShowVou from "../componenets/ShowVou";
import ScanVou from "../componenets/ScanVou";
import ShowVouLab from "../componenets/ShowVouLab";

const LabTech = () => {
  const [active, setActive] = useState("tech");

  const navButtons = [
    { id: "tech", label: "Scan Voucher" },
    { id: "labTechList", label: "Show Vouchers" },
  ];

  const activeLabel = navButtons.find((btn) => btn.id === active)?.label;

  const renderContent = () => {
    switch (active) {
      case "Scan Voucher":
        return <ScanVou />;
      case "labTechList":
        return <ShowVouLab />;
      case "ShowVou":
        return <ShowVou />;
      default:
        return <ScanVou />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-white text-2xl font-bold">
              Lab Tech Dashboard
            </h1>

            <div className="flex gap-2">
              {navButtons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setActive(btn.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    active === btn.id
                      ? "bg-white text-blue-700 shadow-md"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <span className="hidden md:inline">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{activeLabel}</h2>
          <div className="h-1 w-20 bg-blue-600 rounded mt-2"></div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default LabTech;
