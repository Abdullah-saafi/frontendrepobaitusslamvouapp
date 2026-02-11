import React, { useEffect, useState } from "react";
import api from "../../utils/api";

const ShowTechList = () => {
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Report modal
  const [showModal, setShowModal] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);
  const [report, setReport] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchTechs();
  }, []);

  const fetchTechs = async () => {
    try {
      const res = await api.get("/lab-techs");
      setTechs(res.data);
    } catch (err) {
      alert("Failed to load technicians");
    } finally {
      setLoading(false);
    }
  };

  const openReport = (tech) => {
    setSelectedTech(tech);
    setShowModal(true);
    
    // Set default dates (last 7 days)
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(weekAgo.toISOString().split('T')[0]);
    
    // Load report
    loadReport(tech.name, weekAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
  };

  const loadReport = async (techName, start, end) => {
    try {
      const res = await api.get(`/tech-report/${techName}`, {
        params: { startDate: start, endDate: end }
      });
      setReport(res.data);
    } catch (err) {
      alert("Failed to load report");
      setReport([]);
    }
  };

  const deleteTech = async (id) => {
    if (!window.confirm("Delete this technician?")) return;
    
    try {
      await api.delete(`/lab-tech/${id}`);
      setTechs(techs.filter((t) => t._id !== id));
    } catch (err) {
      alert("Failed to delete");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6">
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Branch</th>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-center">Reports</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {techs.map((tech, i) => (
              <tr key={tech._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{tech.name}</td>
                <td className="px-4 py-3">{tech.email}</td>
                <td className="px-4 py-3">{tech.branchname}</td>
                <td className="px-4 py-3">{tech.branchcode}</td>
                <td className="px-4 py-3">{tech.contact}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => openReport(tech)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Report
                    </button>
                  </div>
                </td>
                       <td className="px-4 py-3">
                  <div className="flex gap-2 justify-center">
       
                    <button
                      onClick={() => deleteTech(tech._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {techs.map((tech, i) => (
          <div key={tech._id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start mb-3">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">#{i + 1}</span>
            </div>
            <h3 className="font-bold text-lg mb-2">{tech.name}</h3>
            <div className="space-y-1 text-sm mb-3">
              <p><span className="text-gray-500">Email:</span> {tech.email}</p>
              <p><span className="text-gray-500">Branch:</span> {tech.branchname} ({tech.branchcode})</p>
              <p><span className="text-gray-500">Contact:</span> {tech.contact}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openReport(tech)}
                className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600"
              >
                Report
              </button>
              <button
                onClick={() => deleteTech(tech._id)}
                className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Report: {selectedTech?.name}</h2>
              <button onClick={() => setShowModal(false)} className="text-2xl">&times;</button>
            </div>

            {/* Date Filter */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex gap-3 items-end flex-wrap">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border px-3 py-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border px-3 py-2 rounded"
                  />
                </div>
                <button
                  onClick={() => loadReport(selectedTech.name, startDate, endDate)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Report Content */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
              {report.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No vouchers found</p>
              ) : (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded text-center">
                      <p className="text-2xl font-bold text-blue-600">{report.length}</p>
                      <p className="text-sm text-gray-600">Total Vouchers</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {report.reduce((sum, r) => sum + r.discount, 0)}%
                      </p>
                      <p className="text-sm text-gray-600">Total Discount</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {new Set(report.map(r => r.shopName)).size}
                      </p>
                      <p className="text-sm text-gray-600">Unique Shops</p>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Shop</th>
                          <th className="px-3 py-2 text-left">Card #</th>
                          <th className="px-3 py-2 text-left">Discount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {report.map((r, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{i + 1}</td>
                            <td className="px-3 py-2">
                              {r.usedAt ? new Date(r.usedAt).toLocaleDateString('en-GB') : 'N/A'}
                            </td>
                            <td className="px-3 py-2">{r.shopName}</td>
                            <td className="px-3 py-2 text-gray-600">{r.cardNumber}</td>
                            <td className="px-3 py-2 text-green-600 font-semibold">{r.discount}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowTechList;