import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { UserPlus, UserCheck, Users } from "lucide-react";
import { UserContext } from "../Context/ContextProvider";
import { Link } from "react-router";
import useAxios from "../Context/useAxios";

const Friends = () => {
  const [allFriend, setFriend] = useState([]);
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(false);
  const { DBUser } = useContext(UserContext);
  const axiosSecure = useAxios();

  useEffect(() => {
    const ManageFollowing = async () => {
      // get all user
      setLoading(true);
      const response = await axiosSecure.get("/api/user");
      const users = response.data;
      setLoading(false);

      // get following user
      const response1 = await axios.get(
        `${import.meta.env.VITE_API_URL}/following/${DBUser?.uid}`,
      );
      const UserTotalFollowing = response1?.data?.following || [];

      // show unfollow user with a condition
      const newAllFriend = users.filter(
        (obj) => !UserTotalFollowing.includes(obj?.uid),
      );
      setFriend(newAllFriend);
    };
    ManageFollowing();
  }, []);

  useEffect(() => {
    setActive(Array(allFriend.length).fill(false));
  }, [allFriend]);

  function handleFollowBtn(i, FollowingUserUid) {
    const copy = [...active];
    copy[i] = !copy[i];
    setActive(copy);

    // Update Following count each user
    if (copy[i]) {
      axios
        .patch(`${import.meta.env.VITE_API_URL}/following/${DBUser?.uid}`, {
          FollowingUserUid,
        })
        .then((res) => console.log(res.data));
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-3 sm:px-4 md:px-6">
      <div className="flex items-center gap-2 mb-5">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Explore people</h2>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] w-full items-center justify-center">
          <span className="loading loading-spinner text-primary loading-lg"></span>
        </div>
      ) : allFriend.length === 0 ? (
        <div className="text-center text-base-content/50 py-16 bg-base-200/60 rounded-2xl">
          You're already following everyone on LinkUp.
        </div>
      ) : (
        <div className="space-y-3">
          {allFriend.map((user, index) => (
            <motion.div
              key={user?.uid || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 8) * 0.03 }}
              className="flex items-center gap-4 p-3 sm:p-4 rounded-2xl bg-base-200 hover:bg-base-200/70 border border-base-300/50 transition-colors"
            >
              <Link to={`/otherprofile/${user?.uid}`} className="shrink-0">
                <img
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover"
                  src={user?.photoURL}
                  alt="profile photo"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <Link to={`/otherprofile/${user?.uid}`}>
                  <p className="text-base sm:text-lg font-medium truncate hover:text-primary transition-colors">
                    {user?.name}
                  </p>
                </Link>
                <p className="text-xs sm:text-sm text-base-content/50 truncate mt-0.5">
                  From {user?.address}
                </p>
                <p className="text-xs sm:text-sm text-base-content/50 truncate">
                  Work at {user?.workAt}
                </p>
              </div>

              <button
                onClick={() => handleFollowBtn(index, user?.uid)}
                className={`btn btn-sm shrink-0 rounded-full gap-1.5 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                  !active[index] ? "btn-primary" : "btn-outline btn-primary"
                }`}
              >
                {!active[index] ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Follow</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Following</span>
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Friends;