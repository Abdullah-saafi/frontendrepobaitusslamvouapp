import React, { useState } from "react";
import CreateTech from "../componenets/CreateTech";
import CreateVou from "../componenets/CreateVou";
import ShowTechList from "../componenets/ShowTechList";
import ShowVou from "../componenets/ShowVou";
import ShowVouAdmin from "../componenets/ShowVouAdmin";

const Admin = () => {
  const [active, setActive] = useState("tech");

  const navButtons = [
    { id: "tech", label: "Add Lab Technician" },
    { id: "vou", label: "Create Voucher" },
    { id: "labTechList", label: "All Lab Technicians" },
    { id: "ShowVou", label: "Vouchers Details" },
    { id: "ShowVouAdmin", label: "Technicians Details" },

  ];

  const activeLabel = navButtons.find((btn) => btn.id === active)?.label;

  const renderContent = () => {
    switch (active) {
      case "tech":
        return <CreateTech />;
      case "labTechList":
        return <ShowTechList />;
      case "vou":
        return <CreateVou />;
      case "ShowVou":
        return <ShowVou />;
      case "ShowVouAdmin":
        return <ShowVouAdmin />;
      default:
        return <CreateTech />;
    }
  };

  return (
    <div className=" ">
      <nav className="bg-blue-600  flex sm:justify-end justify-center px">
        <div className="px-10 py-2 ">
          <div className="flex items-center justify-right p-4">
            <div className="flex gap-4 flex-col grid-cols-2 sm:flex-row ">
              {navButtons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setActive(btn.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200  ${
                    active === btn.id
                      ? "bg-white text-blue-700 shadow-md"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <span className="inline">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className=" p-5 sm:p-10  ">
        <div className="">
          <h2 className="text-xl md:text-4xl font-bold text-gray-800 flex ">
            {activeLabel}
          </h2>
          <div className="h-1 w-20 sm:w-40 bg-blue-600 rounded mt-2 mb-6"></div>
        </div>

        <div className="bg-white ">{renderContent()}</div>
      </main>
    </div>
  );
};

export default Admin;
