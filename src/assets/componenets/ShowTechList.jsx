import React, { useEffect, useState } from "react";
import api from "../../utils/api";

const ShowTechList = () => {
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTechs();
  }, []);

  const fetchTechs = async () => {
    try {
      const res = await api.get("/lab-techs");
      setTechs(res.data);
      setError("");
    } catch (err) {
      setError("Failed to load lab technicians");
    } finally {
      setLoading(false);
    }
  };

  const deleteTech = async (id) => {
    if (!window.confirm("Are you sure you want to delete this technician?"))
      return;

    try {
      await api.delete(`/lab-tech/${id}`);
      setTechs(techs.filter((tech) => tech._id !== id));
    } catch (err) {
      alert("Failed to delete technician");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <p className="text-lg text-gray-600">Loading technicians...</p>
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

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Role</th>
                <th className="px-6 py-4 text-left font-semibold">Name</th>
                <th className="px-6 py-4 text-left font-semibold">Email</th>
                <th className="px-6 py-4 text-left font-semibold">Branch</th>
                <th className="px-6 py-4 text-left font-semibold">Contact</th>
                <th className="px-6 py-4 text-center font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {techs.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No lab technicians found
                  </td>
                </tr>
              ) : (
                techs.map((tech) => (
                  <tr key={tech._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {tech.role}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {tech.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {tech.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {tech.branchname}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {tech.contact}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => deleteTech(tech._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShowTechList;
