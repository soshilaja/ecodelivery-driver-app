import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../services/firebase";
import { Camera, Upload, CheckCircle2, X } from "lucide-react";
import toast from "react-hot-toast";
import Address from "../components/Address";

const ProfilePage = () => {
  const { user, driverProfile } = useAuth();

  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);

  const [profileData, setProfileData] = useState({
    fullName: driverProfile?.fullName || "",
    phoneNumber: driverProfile?.phoneNumber || "",
    vehicleType: driverProfile?.vehicleType || "",
    profilePicture: driverProfile?.profilePicture || null,
  });

  const [address, setAddress] = useState({
    address1: driverProfile?.driverAddress?.address1 || "",
    city: driverProfile?.driverAddress?.city || "",
    state: driverProfile?.driverAddress?.province || "",
    postal: driverProfile?.driverAddress?.postalCode || "",
    country: driverProfile?.driverAddress?.country || "",
  });

  const [address2, setAddress2] = useState(
    driverProfile?.driverAddress?.address2 || ""
  );

  const [documents, setDocuments] = useState({
    driverLicense: driverProfile?.documents?.driverLicense || null,
    insurance: driverProfile?.documents?.insurance || null,
  });

  const [isUploading, setIsUploading] = useState(false);

  const profilePicRef = useRef(null);
  const documentRefs = {
    driverLicense: useRef(null),
    insurance: useRef(null),
  };

  const vehicleTypes = ["bike", "electric-bike", "electric-vehicle"];

    // Function to fetch updated driver data
    const fetchDriverData = async () => {
      try {
        setIsLoading(true);
        const driverDocRef = doc(firestore, "drivers", user.uid);
        const driverDoc = await getDoc(driverDocRef);

        if (driverDoc.exists()) {
          const data = driverDoc.data();

          // Update local state
          setProfileData({
            fullName: data.fullName || "",
            phoneNumber: data.phoneNumber || "",
            vehicleType: data.vehicleType || "",
            profilePicture: data.profilePicture || null,
          });

          setAddress({
            address1: data.driverAddress?.address1 || "",
            city: data.driverAddress?.city || "",
            state: data.driverAddress?.province || "",
            postal: data.driverAddress?.postalCode || "",
            country: data.driverAddress?.country || "",
          });

          setAddress2(data.driverAddress?.address2 || "");

          setDocuments({
            driverLicense: data.documents?.driverLicense || null,
            insurance: data.documents?.insurance || null,
          });
        }
      } catch (error) {
        toast.error("Failed to fetch profile data");
        console.error("Error fetching driver data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial data load
    useEffect(() => {
      fetchDriverData();
    }, [user.uid]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(
        storage,
        `profile-pictures/${user.uid}/profile-${Date.now()}`
      );

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setProfileData((prev) => ({
        ...prev,
        profilePicture: downloadURL,
      }));

      toast.success("Profile picture uploaded successfully");
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (documentType) => {
    const file = documentRefs[documentType].current.files[0];
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);
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
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentRemove = (documentType) => {
    setDocuments((prev) => ({
      ...prev,
      [documentType]: null,
    }));
    documentRefs[documentType].current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !profileData.fullName ||
      !profileData.phoneNumber ||
      !profileData.vehicleType ||
      !address.address1
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!documents.driverLicense || !documents.insurance) {
      toast.error("Please upload all required documents");
      return;
    }

    const driverAddress = {
      address1: address.address1,
      address2: address2,
      city: address.city,
      province: address.state,
      postalCode: address.postal,
      country: address.country,
    };

    try {
      const driverDocRef = doc(firestore, "drivers", user.uid);
      await updateDoc(driverDocRef, {
        ...profileData,
        driverAddress,
        documents,
        profileCompletionStatus: "complete",
        updatedAt: new Date(),
      });

      // Fetch updated data
     await fetchDriverData();

      toast.success("Profile updated successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(`Profile update failed: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Complete Your Driver Profile
              </h1>
              <p className="mt-2 text-gray-600">
                Help us verify your details and get you on the road
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                    {profileData.profilePicture ? (
                      <img
                        src={profileData.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Camera className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => profilePicRef.current.click()}
                    className="absolute bottom-0 right-0 bg-green-600 rounded-full p-2 text-white hover:bg-green-700 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input
                    type="file"
                    ref={profilePicRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureUpload}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Upload a profile picture
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
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
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <Address
                address={address}
                setAddress={setAddress}
                address2={address2}
                setAddress2={setAddress2}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vehicle Type
                </label>
                <select
                  name="vehicleType"
                  value={profileData.vehicleType}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
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

              {/* Documents Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Required Documents
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {["driverLicense", "insurance"].map((docType) => (
                    <div key={docType} className="relative">
                      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors">
                        <input
                          type="file"
                          ref={documentRefs[docType]}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={() => handleFileUpload(docType)}
                        />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700">
                              {docType === "driverLicense"
                                ? "Driver's License"
                                : "Insurance Document"}
                            </label>
                            {documents[docType] && (
                              <button
                                type="button"
                                onClick={() => handleDocumentRemove(docType)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              documentRefs[docType].current.click()
                            }
                            className={`w-full flex items-center justify-center space-x-2 py-2 px-4 border rounded-md shadow-sm text-sm font-medium
                              ${
                                documents[docType]
                                  ? "text-green-700 bg-green-50 border-green-200 hover:bg-green-100"
                                  : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
                              }`}
                          >
                            {documents[docType] ? (
                              <>
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="truncate">
                                  {documents[docType].name}
                                </span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-5 h-5" />
                                <span>
                                  Upload{" "}
                                  {docType === "driverLicense"
                                    ? "License"
                                    : "Insurance"}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isUploading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white
                    ${
                      isUploading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    }`}
                >
                  {isUploading ? "Uploading..." : "Complete Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
