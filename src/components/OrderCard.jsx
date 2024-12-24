import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  updateDoc,
  doc,
  addDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import {
  MapPinIcon,
  ClockIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  BanknotesIcon,
} from "@heroicons/react/24/solid";
import { firestore } from "../services/firebase";

// Predefined decline reasons
const DECLINE_REASONS = {
  DISTANCE: "Distance too far",
  PAYMENT: "Payment too low",
  AREA: "Unsafe delivery area",
  WEATHER: "Bad weather conditions",
  VEHICLE: "Vehicle issues",
  SCHEDULE: "Schedule conflict",
  PACKAGE: "Package too heavy/large",
  OTHER: "Other reason",
};

// Function to format address for display
const formatAddress = (addressData) => {
  if (!addressData) return "";
  const parts = [
    addressData.address1,
    addressData.address2,
    addressData.city,
    addressData.province,
    addressData.postalCode,
    addressData.country,
  ].filter(Boolean);
  return parts.join(", ");
};

// Decline Modal Component
const DeclineModal = ({ isOpen, onClose, onDecline }) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Decline Order</h3>

        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        >
          <option value="">Select a reason</option>
          {Object.entries(DECLINE_REASONS).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Additional details (optional)"
          className="w-full p-2 border rounded mb-4 h-24 resize-none"
        />

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!reason) {
                toast.error("Please select a reason");
                return;
              }
              onDecline(reason, details);
              onClose();
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Decline Order
          </button>
        </div>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: ClockIcon },
    accepted: { color: "bg-blue-100 text-blue-800", icon: CheckCircleIcon },
    "picked-up": { color: "bg-green-100 text-green-800", icon: TruckIcon },
    completed: { color: "bg-gray-100 text-gray-800", icon: CheckCircleIcon },
    declined: { color: "bg-red-100 text-red-800", icon: XCircleIcon },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={`flex items-center space-x-1 px-2 py-1 rounded-full ${config.color}`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium capitalize">{status}</span>
    </span>
  );
};

// Main OrderCard Component
export const OrderCard = ({ order = {}, type = "" }) => {
  const { user } = useAuth();
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (order.declinedDrivers?.includes(user?.uid)) {
      setIsHidden(true);
    }
  }, [order, user]);

  if (!order || !type || isHidden) return null;

  const handleOrderAction = async (action, reason = "", details = "") => {
    try {
      if (!user) {
        toast.error("Please log in to perform this action");
        return;
      }

      const orderRef = doc(firestore, "orders", order.id);

      switch (action) {
        case "accept":
          await updateDoc(orderRef, {
            status: "accepted",
            driverId: user.uid,
            acceptedAt: serverTimestamp(),
          });
          toast.success("Order accepted successfully!");
          break;

        case "decline":
          await updateDoc(orderRef, {
            status: "pending",
            driverId: null,
            lastDeclinedAt: serverTimestamp(),
            declineCount: (order.declineCount || 0) + 1,
            declinedDrivers: arrayUnion(user.uid),
          });

          // Log decline record
          await addDoc(collection(firestore, "order_declines"), {
            orderId: order.id,
            driverId: user.uid,
            reason,
            details,
            timestamp: serverTimestamp(),
            orderDetails: {
              pickupAddress: order.pickupAddress,
              deliveryAddress: order.deliveryAddress,
              price: order.price,
              weight: order.shippingWeight,
            },
          });

          toast.error("Order declined");
          break;

        case "pickup":
          await updateDoc(orderRef, {
            status: "picked-up",
            pickedUpAt: serverTimestamp(),
          });
          toast.success("Package picked up!");
          break;

        case "complete":
          await updateDoc(orderRef, {
            status: "completed",
            completedAt: serverTimestamp(),
          });

          // Log earnings
          await addDoc(collection(firestore, "earnings"), {
            driverId: user.uid,
            orderId: order.orderId,
            amount: order.price,
            date: serverTimestamp(),
          });

          toast.success("Delivery completed!");
          break;

        default:
          throw new Error("Invalid action");
      }
    } catch (error) {
      console.error("Order action failed:", error);
      toast.error(`Action failed: ${error.message}`);
    }
  };

  const renderActionButtons = () => {
    switch (type) {
      case "available": {
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleOrderAction("accept")}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => setShowDeclineModal(true)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              Decline
            </button>
          </div>
        );
      }

      case "active": {
        const actions = {
          accepted: (
            <button
              onClick={() => handleOrderAction("pickup")}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Pick Up
            </button>
          ),
          "picked-up": (
            <button
              onClick={() => handleOrderAction("complete")}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
            >
              Complete Delivery
            </button>
          ),
        };
        return actions[order.status] || null;
      }

      default:
        return null;
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-4 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start">
        <div className="space-y-4 flex-1">
          {/* Order Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">
              Order #{order.orderId?.slice(-6)}
            </h3>
            <StatusBadge status={order.status} />
          </div>

          {/* Addresses */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPinIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <span className="text-gray-600">
                From: {formatAddress(order.pickupAddress)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPinIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-gray-600">
                To: {formatAddress(order.deliveryAddress)}
              </span>
            </div>
          </div>

          {/* Package Details */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <EnvelopeIcon className="h-5 w-5 text-blue-500" />
              <span className="text-gray-600">
                {order.shippingItem} - {order.shippingWeight} kg
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-gray-500" />
              <span className="text-gray-600">{order.duration} mins</span>
            </div>
            <div className="flex items-center space-x-2">
              <BanknotesIcon className="h-5 w-5 text-green-500" />
              <span className="font-bold text-green-600">
                ${order.price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex justify-end">{renderActionButtons()}</div>

      {/* Decline Modal */}
      <DeclineModal
        isOpen={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        onDecline={(reason, details) =>
          handleOrderAction("decline", reason, details)
        }
      />
    </div>
  );
};

// PropTypes validation
OrderCard.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.string.isRequired,
    orderId: PropTypes.string.isRequired,
    pickupAddress: PropTypes.shape({
      address1: PropTypes.string.isRequired,
      address2: PropTypes.string,
      city: PropTypes.string.isRequired,
      province: PropTypes.string.isRequired,
      postalCode: PropTypes.string.isRequired,
      country: PropTypes.string.isRequired,
    }).isRequired,
    deliveryAddress: PropTypes.shape({
      address1: PropTypes.string.isRequired,
      address2: PropTypes.string,
      city: PropTypes.string.isRequired,
      province: PropTypes.string.isRequired,
      postalCode: PropTypes.string.isRequired,
      country: PropTypes.string.isRequired,
    }).isRequired,
    shippingItem: PropTypes.string.isRequired,
    shippingWeight: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    declineCount: PropTypes.number,
    declinedDrivers: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  type: PropTypes.oneOf(["available", "active"]).isRequired,
};

DeclineModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onDecline: PropTypes.func,
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};

export default OrderCard;