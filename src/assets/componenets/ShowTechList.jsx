import React, { useEffect, useState } from "react";
import api from "../../utils/api";

const ShowTechList = () => {
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTechs = async () => {
    try {
      const res = await api.get("/lab-techs");
      setTechs(res.data);
    } catch (err) {
      alert("Failed to load lab technicians");
    } finally {
      setLoading(false);
    }
  };

  const deleteTech = async (id) => {
    if (!window.confirm("Delete this technician?")) return;
    await api.delete(
      `https://bacendrepobaitusslamvouapp-production.up.railway.app/lab-tech/${id}`,
    );
    fetchTechs();
  };

  useEffect(() => {
    fetchTechs();
  }, []);

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-4">Lab Technicians</h2>

      <table className="w-full border border-gray-400 border-collapse">
        <thead>
          <tr className="bg-blue-600 text-white text-2xl px-6">
            <th className="border border-gray-400 p-2">Role</th>
            <th className="border border-gray-400 p-2">Name</th>
            <th className="border border-gray-400 p-2">Email</th>
            <th className="border border-gray-400 p-2">Branch</th>
            <th className="border border-gray-400 p-2">Contact</th>
            <th className="border border-gray-400 p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {techs.map((tech) => (
            <tr key={tech._id} className="text-center text-md font-bold">
              <td className="border border-gray-400 p-2">{tech.role}</td>
              <td className="border border-gray-400 p-2">{tech.name}</td>
              <td className="border border-gray-400 p-2">{tech.email}</td>
              <td className="border border-gray-400 p-2">{tech.branchname}</td>
              <td className="border border-gray-400 p-2">{tech.contact}</td>
              <td className="border border-gray-400 p-2">
                <button
                  onClick={() => deleteTech(tech._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {techs.length === 0 && (
            <tr>
              <td colSpan="6" className="border p-4 text-center">
                No lab technicians found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ShowTechList;
