import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../services/firebase";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { user, driverProfile } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    fullName: driverProfile?.fullName || "",
    phoneNumber: driverProfile?.phoneNumber || "",
    vehicleType: driverProfile?.vehicleType || "",
    address: driverProfile?.address || "",
  });

  const [documents, setDocuments] = useState({
    driverLicense: null,
    insurance: null,
  });

  const documentRefs = {
    driverLicense: useRef(null),
    insurance: useRef(null),
  };

  const vehicleTypes = ["Bike", "E-bike", "E-scooter", "Electric Vehicle (EV)"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = async (documentType) => {
    const file = documentRefs[documentType].current.files[0];
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    try {
      const storageRef = ref(
        storage,
        `driver-documents/${user.uid}/${documentType}-${Date.now()}`
      );

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setDocuments((prev) => ({
        ...prev,
        [documentType]: {
          name: file.name,
          url: downloadURL,
        },
      }));

      toast.success(`${documentType} uploaded successfully`);
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !profileData.fullName ||
      !profileData.phoneNumber ||
      !profileData.vehicleType
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!documents.driverLicense || !documents.insurance) {
      toast.error("Please upload all required documents");
      return;
    }

    try {
      const driverDocRef = doc(firestore, "drivers", user.uid);

      await updateDoc(driverDocRef, {
        ...profileData,
        documents: {
          driverLicense: documents.driverLicense,
          insurance: documents.insurance,
        },
        profileCompletionStatus: "complete",
        updatedAt: new Date(),
      });

      toast.success("Profile updated successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(`Profile update failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-green-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-3xl font-extrabold text-center text-green-600">
                  Complete Your Driver Profile
                </h2>
                <p className="text-center text-gray-500">
                  Help us verify your details and get you on the road
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={profileData.phoneNumber}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vehicle Type
                  </label>
                  <select
                    name="vehicleType"
                    value={profileData.vehicleType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Vehicle Type</option>
                    {vehicleTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Driver&#39;s License
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="file"
                      ref={documentRefs.driverLicense}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={() => handleFileUpload("driverLicense")}
                    />
                    <button
                      type="button"
                      onClick={() => documentRefs.driverLicense.current.click()}
                      className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {documents.driverLicense
                        ? `✓ ${documents.driverLicense.name}`
                        : "Upload License"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Insurance Document
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="file"
                      ref={documentRefs.insurance}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={() => handleFileUpload("insurance")}
                    />
                    <button
                      type="button"
                      onClick={() => documentRefs.insurance.current.click()}
                      className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {documents.insurance
                        ? `✓ ${documents.insurance.name}`
                        : "Upload Insurance"}
                    </button>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Complete Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
