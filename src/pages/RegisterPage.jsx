import { useState } from "react";
import { uploadBytes, getDownloadURL, ref } from "firebase/storage";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, storage, firestore } from "../services/firebase";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";


const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    vehicleType: "",
    driverLicense: null,
    insuranceProof: null,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const vehicleTypes = ["Bike", "E-bike", "Electric Vehicle (EV)"];

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 12;

    const errors = [];
    if (!hasUpperCase) errors.push("uppercase letter");
    if (!hasLowerCase) errors.push("lowercase letter");
    if (!hasNumber) errors.push("number");
    if (!hasSpecialChar) errors.push("special character");
    if (!isLongEnough) errors.push("minimum length of 12 characters");

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear password-related errors when user types
    if (name === "password" || name === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        password: undefined,
        confirmPassword: undefined,
      }));
    }
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

    // Password validation
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = `Password must include: ${passwordValidation.errors.join(
        ", "
      )}`;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

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

      await setDoc(doc(firestore, "drivers", user.uid), {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        vehicleType: formData.vehicleType,
        driverLicenseUrl,
        insuranceProofUrl,
        greenScore: 0,
        status: "Offline",
        registeredAt: new Date(),
      });

      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
        vehicleType: "",
        driverLicense: null,
        insuranceProof: null,
      });

      toast.success(
        "Registration Successful! Please check your email to complete setup."
      );
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration Error:", error);
      toast.error(`Registration Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center text-green-700">
          EcoDelivery Driver Registration
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

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.password ? "border-red-500" : "border-gray-300"
              } shadow-sm py-2 px-3`}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              Password must be at least 12 characters long and contain
              uppercase, lowercase, number, and special character.
            </p>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              } shadow-sm py-2 px-3`}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword}
              </p>
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
