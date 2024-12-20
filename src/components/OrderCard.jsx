import PropTypes from "prop-types";
import toast from "react-hot-toast";
import { firestore } from "../services/firebase";
import {
  collection,
  updateDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import {
  MapPinIcon,
  ClockIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";


const handleOrderAction = async (order, action, user) => {
  try {
    const orderRef = doc(firestore, "orders", order.id);

    switch (action) {
      case "accept":
        await updateDoc(orderRef, {
          status: "accepted",
          driverId: user.uid,
          acceptedAt: new Date(),
        });
        toast.success("Order accepted successfully!");
        break;

      case "decline":
        await updateDoc(orderRef, {
          status: "pending",
          driverId: null,
        });
        toast.info("Order declined");
        break;

      case "pickup":
        await updateDoc(orderRef, {
          status: "picked-up",
          pickedUpAt: new Date(),
        });
        toast.success("Package picked up!");
        break;

      case "complete":
        await updateDoc(orderRef, {
          status: "completed",
          completedAt: new Date(),
        });

        // Log earnings
        await addDoc(collection(firestore, "earnings"), {
          driverId: user.uid,
          orderId: order.id,
          amount: order.fee,
          date: new Date(),
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

export const OrderCard = ({ order = {}, type = "" }) => {
  if (!order || !type) return null;
  const renderActionButtons = () => {
    switch (type) {
      case "available": {
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleOrderAction(order, "accept")}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              Accept
            </button>
            <button
              onClick={() => handleOrderAction(order, "decline")}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
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
              onClick={() => handleOrderAction(order, "pickup")}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Pick Up
            </button>
          ),
          "picked-up": (
            <button
              onClick={() => handleOrderAction(order, "complete")}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              Complete Delivery
            </button>
          ),
          "in-transit": (
            <button
              onClick={() => handleOrderAction(order, "complete")}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              Complete Delivery
            </button>
          ),
        };
        return actions[order.status] || null;
      }

      default: {
        return null;
      }
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            Order #{order.id.slice(-6)}
          </h3>
          <div className="flex items-center space-x-2 mt-2">
            <MapPinIcon className="h-5 w-5 text-gray-500" />
            <span>{order.pickupAddress}</span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <MapPinIcon className="h-5 w-5 text-gray-500" />
            <span>{order.dropoffAddress}</span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <EnvelopeIcon className="h-5 w-5 text-gray-500" />
            <span>
              {order.packageType} - {order.packageWeight} kg
            </span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <ClockIcon className="h-5 w-5 text-gray-500" />
            <span>{order.estimatedDeliveryTime}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-green-600">${order.fee.toFixed(2)}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {order.status === "pending" && (
            <XCircleIcon className="h-5 w-5 text-yellow-500" />
          )}
          {order.status === "accepted" && (
            <CheckCircleIcon className="h-5 w-5 text-blue-500" />
          )}
          {order.status === "picked-up" && (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          )}
          <span className="capitalize">{order.status}</span>
        </div>
        {renderActionButtons()}
      </div>
    </div>
  );
};

// PropTypes validation for OrderCard
OrderCard.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.string.isRequired,
    pickupAddress: PropTypes.string.isRequired,
    dropoffAddress: PropTypes.string.isRequired,
    packageType: PropTypes.string.isRequired,
    packageWeight: PropTypes.number.isRequired,
    estimatedDeliveryTime: PropTypes.string.isRequired,
    fee: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
  type: PropTypes.oneOf(["available", "active"]).isRequired,
};
