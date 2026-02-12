import React, { useEffect, useState } from "react";
import api from "../../utils/api";

const ShowTechList = () => {
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);
  const [report, setReport] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTech, setEditTech] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    setEndDate(today.toISOString().split("T")[0]);
    setStartDate(weekAgo.toISOString().split("T")[0]);

    loadReport(
      tech.name,
      weekAgo.toISOString().split("T")[0],
      today.toISOString().split("T")[0],
    );
  };

  const loadReport = async (techName, start, end) => {
    try {
      const res = await api.get(`/tech-report/${techName}`, {
        params: { startDate: start, endDate: end },
      });
      setReport(res.data);
    } catch (err) {
      alert("Failed to load report");
      setReport([]);
    }
  };

  const openEditModal = (tech) => {
    setEditTech(tech);
    setNewPassword("");
    setConfirmPassword("");
    setShowEditModal(true);
  };

  const updatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert("Please fill in all password fields");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await api.put(`/lab-tech/${editTech._id}/password`, {
        password: newPassword,
      });
      alert("Password updated successfully");
      setShowEditModal(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update password");
    }
  };

  const deleteTech = async (id) => {
    if (!window.confirm("Delete this technician?")) return;

    try {
      await api.delete(`/lab-tech/${id}`);
      setTechs(techs.filter((t) => t._id !== id));
      alert("Technician deleted successfully");
    } catch (err) {
      alert("Failed to delete");
    }
  };

  if (loading) return <div className="p-8 text-center text-xl">Loading...</div>;

  return (
    <div className="p-6">
      {techs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No technicians found</p>
        </div>
      ) : (
        <>
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
                          onClick={() => openEditModal(tech)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                        >
                          Edit Pass
                        </button>
                        <button
                          onClick={() => deleteTech(tech._id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
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

          <div className="md:hidden space-y-4">
            {techs.map((tech, i) => (
              <div key={tech._id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                    #{i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-2">{tech.name}</h3>
                <div className="space-y-1 text-sm mb-3">
                  <p>
                    <span className="text-gray-500">Email:</span> {tech.email}
                  </p>
                  <p>
                    <span className="text-gray-500">Branch:</span>{" "}
                    {tech.branchname} ({tech.branchcode})
                  </p>
                  <p>
                    <span className="text-gray-500">Contact:</span>{" "}
                    {tech.contact}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openReport(tech)}
                    className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600"
                  >
                    Report
                  </button>
                  <button
                    onClick={() => openEditModal(tech)}
                    className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                  >
                    Edit Pass
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
        </>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Update Password</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Change technician password
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-white hover:bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center transition"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Technician Name
                    </p>
                    <p className="font-semibold text-gray-800">
                      {editTech?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="font-semibold text-gray-800">
                      {editTech?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Branch</p>
                    <p className="font-semibold text-gray-800">
                      {editTech?.branchname}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Branch Code</p>
                    <p className="font-semibold text-gray-800">
                      {editTech?.branchcode}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Note:</span> Password must be
                  at least 6 characters long
                </p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t rounded-b-lg flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="bg-gray-500 text-white px-6 py-2.5 rounded-lg hover:bg-gray-600 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={updatePassword}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-md hover:shadow-lg"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Technician Report</h2>
                  <p className="text-green-100 text-sm mt-1">
                    {selectedTech?.name} - {selectedTech?.branchname}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-green-500 rounded-full w-8 h-8 flex items-center justify-center transition"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-b">
              <div className="flex gap-3 items-end flex-wrap">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <button
                  onClick={() =>
                    loadReport(selectedTech.name, startDate, endDate)
                  }
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-medium shadow-md"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto" style={{ maxHeight: "60vh" }}>
              {report.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-gray-500 text-lg">
                    No vouchers found for this period
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white shadow-md">
                      <p className="text-3xl font-bold">{report.length}</p>
                      <p className="text-sm text-blue-100 mt-1">
                        Total Vouchers Used
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg text-white shadow-md">
                      <p className="text-3xl font-bold">
                        {report.reduce((sum, r) => sum + r.discount, 0)}%
                      </p>
                      <p className="text-sm text-green-100 mt-1">
                        Total Discount Given
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg text-white shadow-md">
                      <p className="text-3xl font-bold">
                        {new Set(report.map((r) => r.shopName)).size}
                      </p>
                      <p className="text-sm text-purple-100 mt-1">
                        Unique Shops
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            #
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Shop Name
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Card Number
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Discount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {report.map((r, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-600">
                              {i + 1}
                            </td>
                            <td className="px-4 py-3">
                              {r.usedAt
                                ? new Date(r.usedAt).toLocaleDateString("en-GB")
                                : "N/A"}
                            </td>
                            <td className="px-4 py-3 font-medium">
                              {r.shopName}
                            </td>
                            <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                              {r.cardNumber}
                            </td>
                            <td className="px-4 py-3">
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                                {r.discount}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-500 text-white px-6 py-2.5 rounded-lg hover:bg-gray-600 transition font-medium"
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
