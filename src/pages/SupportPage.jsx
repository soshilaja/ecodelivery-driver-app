import { useState } from "react";
import {
  ShieldExclamationIcon,
  PhoneIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";
import { collection, addDoc } from "firebase/firestore";
import { firestore } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const SupportPage = () => {
  const { user, driverProfile } = useAuth();
  const [incidentReport, setIncidentReport] = useState({
    type: "",
    description: "",
    location: "",
  });

  const emergencyContacts = [
    { name: "Police", number: "911" },
    { name: "EcoWheels Support", number: "1-800-ECO-HELP" },
    { name: "Medical Emergency", number: "911" },
  ];

  const handleIncidentSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(firestore, "incidents"), {
        ...incidentReport,
        driverId: user.uid,
        reportedAt: new Date(),
        status: "pending",
      });
      toast.success("Incident reported successfully");
      setIncidentReport({ type: "", description: "", location: "" });
    } catch (error) {
      toast.error("Failed to report incident", error);
    }
  };

  const triggerEmergencyProtocol = () => {
    // Alert system and share current location
    navigator.geolocation.getCurrentPosition(async (position) => {
      await addDoc(collection(firestore, "emergencies"), {
        driverId: user.uid,
        driverName: driverProfile.fullName,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        timestamp: new Date(),
      });

      toast.error("EMERGENCY ALERT TRIGGERED", {
        duration: 10000,
        icon: "🚨",
      });
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-20">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Driver Support & Safety
        </h1>

        {/* Emergency Button */}
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-red-800">
                Emergency Support
              </h2>
              <p className="text-red-600">
                Press the button below if you need immediate assistance
              </p>
            </div>
            <button
              onClick={triggerEmergencyProtocol}
              className="bg-red-500 text-white px-6 py-3 rounded-full animate-pulse hover:bg-red-600"
            >
              EMERGENCY
            </button>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Emergency Contacts
          </h2>
          {emergencyContacts.map((contact, index) => (
            <div
              key={index}
              className="flex justify-between items-center border-b py-3 last:border-b-0"
            >
              <div className="flex items-center space-x-4">
                <PhoneIcon className="h-6 w-6 text-green-500" />
                <span className="font-medium">{contact.name}</span>
              </div>
              <a
                href={`tel:${contact.number}`}
                className="text-blue-500 hover:underline"
              >
                {contact.number}
              </a>
            </div>
          ))}
        </div>

        {/* Incident Reporting */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Report an Incident
          </h2>
          <form onSubmit={handleIncidentSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Incident Type
              </label>
              <select
                value={incidentReport.type}
                onChange={(e) =>
                  setIncidentReport((prev) => ({
                    ...prev,
                    type: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              >
                <option value="">Select Incident Type</option>
                <option value="package-damage">Package Damage</option>
                <option value="safety-concern">Safety Concern</option>
                <option value="vehicle-issue">Vehicle Issue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={incidentReport.description}
                onChange={(e) =>
                  setIncidentReport((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={incidentReport.location}
                onChange={(e) =>
                  setIncidentReport((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
            >
              Submit Incident Report
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
