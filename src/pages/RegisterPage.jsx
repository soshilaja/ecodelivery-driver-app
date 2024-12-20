import { useState } from "react";
import { uploadBytes, getDownloadURL, ref } from "firebase/storage";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, storage, firestore } from "../services/firebase";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    vehicleType: "",
    driverLicense: null,
    insuranceProof: null,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const vehicleTypes = ["Bike", "E-bike", "E-scooter", "Electric Vehicle (EV)"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (e, documentType) => {
    const file = e.target.files[0];
    setFormData((prev) => ({
      ...prev,
      [documentType]: file,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName) newErrors.fullName = "Full Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phoneNumber)
      newErrors.phoneNumber = "Phone Number is required";
    if (!formData.vehicleType)
      newErrors.vehicleType = "Vehicle Type is required";
    if (!formData.driverLicense)
      newErrors.driverLicense = "Driver's License is required";
    if (!formData.insuranceProof)
      newErrors.insuranceProof = "Insurance Proof is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadDocument = async (file, userId, documentType) => {
    if (!file) return null;

    const storageRef = ref(
      storage,
      `driver-documents/${userId}/${documentType}`
    );
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        "TempPassword123!" // You'd want to implement a more secure password generation/reset
      );
      const user = userCredential.user;

      // Upload documents
      const driverLicenseUrl = await uploadDocument(
        formData.driverLicense,
        user.uid,
        "driver-license"
      );
      const insuranceProofUrl = await uploadDocument(
        formData.insuranceProof,
        user.uid,
        "insurance-proof"
      );

      // Save driver profile to Firestore
      await setDoc(doc(firestore, "drivers", user.uid), {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        vehicleType: formData.vehicleType,
        driverLicenseUrl,
        insuranceProofUrl,
        greenScore: 0, // Initial green score
        status: "Offline", // Initial status
        registeredAt: new Date(),
      });

      // Reset form and show success message
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        vehicleType: "",
        driverLicense: null,
        insuranceProof: null,
      });

      alert(
        "Registration Successful! Please check your email to complete setup."
      );
    } catch (error) {
      console.error("Registration Error:", error);
      alert(`Registration Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-700">
          EcoWheels Driver Registration
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.fullName ? "border-red-500" : "border-gray-300"
              } shadow-sm py-2 px-3`}
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.email ? "border-red-500" : "border-gray-300"
              } shadow-sm py-2 px-3`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone Number Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.phoneNumber ? "border-red-500" : "border-gray-300"
              } shadow-sm py-2 px-3`}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Vehicle Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Vehicle Type
            </label>
            <select
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.vehicleType ? "border-red-500" : "border-gray-300"
              } shadow-sm py-2 px-3`}
            >
              <option value="">Select Vehicle Type</option>
              {vehicleTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.vehicleType && (
              <p className="text-red-500 text-xs mt-1">{errors.vehicleType}</p>
            )}
          </div>

          {/* Driver's License Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Driver&#39;s License (PDF or Image)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileUpload(e, "driverLicense")}
              className={`mt-1 block w-full rounded-md border ${
                errors.driverLicense ? "border-red-500" : "border-gray-300"
              } shadow-sm py-2 px-3`}
            />
            {errors.driverLicense && (
              <p className="text-red-500 text-xs mt-1">
                {errors.driverLicense}
              </p>
            )}
          </div>

          {/* Insurance Proof Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Insurance Proof (PDF or Image)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileUpload(e, "insuranceProof")}
              className={`mt-1 block w-full rounded-md border ${
                errors.insuranceProof ? "border-red-500" : "border-gray-300"
              } shadow-sm py-2 px-3`}
            />
            {errors.insuranceProof && (
              <p className="text-red-500 text-xs mt-1">
                {errors.insuranceProof}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md 
                         hover:bg-green-700 focus:outline-none focus:ring-2 
                         focus:ring-green-500 focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Registering..." : "Register as Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
