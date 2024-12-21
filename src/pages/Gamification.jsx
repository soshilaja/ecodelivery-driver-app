import { useState, useEffect } from "react";
import {
  TrophyIcon,
  FireIcon,
  StarIcon,
  GiftIcon,
} from "@heroicons/react/24/solid";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { firestore } from "../services/firebase";
import toast from "react-hot-toast";

const Gamification = () => {
  const { user, driverProfile } = useAuth();
  const [driverStats, setDriverStats] = useState({
    completedDeliveries: 0,
    totalEarnings: 0,
    greenScore: 0,
  });

  const [leaderboard, setLeaderboard] = useState([]);
  // const [availableRewards, setAvailableRewards] = useState([]);

  useEffect(() => {
    const fetchDriverStats = async () => {
      if (!user) return;

      try {
        // Fetch completed deliveries
        const deliveriesQuery = query(
          collection(firestore, "orders"),
          where("driverId", "==", user.uid),
          where("status", "==", "completed")
        );
        const deliveriesSnapshot = await getDocs(deliveriesQuery);

        // Fetch leaderboard
        const leaderboardQuery = query(
          collection(firestore, "drivers"),
          where("status", "==", "active")
        );
        const leaderboardSnapshot = await getDocs(leaderboardQuery);

        const leaderboardData = leaderboardSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => b.completedDeliveries - a.completedDeliveries)
          .slice(0, 10);

        setDriverStats({
          completedDeliveries: deliveriesSnapshot.size,
          totalEarnings: driverProfile.totalEarnings || 0,
          greenScore: driverProfile.greenScore || 0,
        });

        setLeaderboard(leaderboardData);
      } catch (error) {
        console.error("Error fetching driver stats:", error);
      }
    };

    fetchDriverStats();
  }, [user, driverProfile]);

  const claimReward = async (reward) => {
    try {
      await updateDoc(doc(firestore, "drivers", user.uid), {
        availableRewards: reward.id,
      });

      toast.success(`Reward "${reward.name}" claimed!`);
    } catch (error) {
      toast.error("Failed to claim reward", error);
    }
  };

  const badges = [
    {
      milestone: 10,
      name: "Rookie Rider",
      icon: <StarIcon className="h-6 w-6 text-yellow-500" />,
    },
    {
      milestone: 50,
      name: "Delivery Pro",
      icon: <FireIcon className="h-6 w-6 text-red-500" />,
    },
    {
      milestone: 100,
      name: "Eco Champion",
      icon: <TrophyIcon className="h-6 w-6 text-green-500" />,
    },
  ];

  const rewards = [
    {
      id: "green-bonus",
      name: "Green Vehicle Bonus",
      description: "Extra $50 for using eco-friendly transport",
      requiredDeliveries: 25,
      requiredGreenScore: 75,
    },
    {
      id: "peak-hour-bonus",
      name: "Peak Hour Master",
      description: "Additional 15% on peak hour deliveries",
      requiredDeliveries: 50,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-20">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Driver Rewards & Achievements
        </h1>

        {/* Driver Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Completed Deliveries
            </h2>
            <div className="flex items-center space-x-4">
              <TrophyIcon className="h-10 w-10 text-green-500" />
              <span className="text-3xl font-bold">
                {driverStats.completedDeliveries}
              </span>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Total Earnings
            </h2>
            <div className="flex items-center space-x-4">
              <GiftIcon className="h-10 w-10 text-blue-500" />
              <span className="text-3xl font-bold">
                ${driverStats.totalEarnings.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Green Score
            </h2>
            <div className="flex items-center space-x-4">
              <StarIcon className="h-10 w-10 text-green-600" />
              <span className="text-3xl font-bold">
                {driverStats.greenScore}
              </span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.name}
                className={`bg-white shadow-md rounded-lg p-4 flex items-center space-x-4 
                  ${
                    driverStats.completedDeliveries >= badge.milestone
                      ? "opacity-100"
                      : "opacity-50"
                  }`}
              >
                {badge.icon}
                <div>
                  <h3 className="font-semibold">{badge.name}</h3>
                  <p className="text-sm text-gray-500">
                    {badge.milestone} deliveries
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rewards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Available Rewards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className={`bg-white shadow-md rounded-lg p-4 
                  ${
                    driverStats.completedDeliveries >=
                      reward.requiredDeliveries &&
                    (!reward.requiredGreenScore ||
                      driverStats.greenScore >= reward.requiredGreenScore)
                      ? "border-2 border-green-500"
                      : "opacity-50"
                  }`}
              >
                <h3 className="font-semibold text-xl mb-2">{reward.name}</h3>
                <p className="text-gray-600 mb-4">{reward.description}</p>
                <div className="text-sm text-gray-500 mb-2">
                  Requirements:
                  <ul className="list-disc list-inside">
                    <li>Completed Deliveries: {reward.requiredDeliveries}+</li>
                    {reward.requiredGreenScore && (
                      <li>Green Score: {reward.requiredGreenScore}+</li>
                    )}
                  </ul>
                </div>
                <button
                  onClick={() => claimReward(reward)}
                  disabled={
                    driverStats.completedDeliveries <
                      reward.requiredDeliveries ||
                    (reward.requiredGreenScore &&
                      driverStats.greenScore < reward.requiredGreenScore)
                  }
                  className={`w-full py-2 rounded-md mt-4 
                    ${
                      driverStats.completedDeliveries >=
                        reward.requiredDeliveries &&
                      (!reward.requiredGreenScore ||
                        driverStats.greenScore >= reward.requiredGreenScore)
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  Claim Reward
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Leaderboard</h2>
          <div className="bg-white shadow-md rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left">Rank</th>
                  <th className="p-4 text-left">Driver Name</th>
                  <th className="p-4 text-right">Completed Deliveries</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((driver, index) => (
                  <tr
                    key={driver.id}
                    className={`border-b last:border-b-0 
                      ${
                        driver.id === user?.uid
                          ? "bg-blue-50 font-semibold"
                          : "hover:bg-gray-50"
                      }`}
                  >
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4">{driver.name || "Anonymous"}</td>
                    <td className="p-4 text-right">
                      {driver.completedDeliveries}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gamification;
