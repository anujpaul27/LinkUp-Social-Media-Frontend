import { motion } from "framer-motion";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import {
  Home,
  Compass,
  Bookmark,
  Send,
  BarChart2,
  Settings,
  LogOut,
} from "lucide-react";
import { UserContext } from "../Context/ContextProvider";

// NOTE: There is no "contacts / recent chats" endpoint yet, so this list
// is placeholder content for the visual redesign — swap for a real
// conversations query once that API exists.
const mockContacts = [
  { id: 1, name: "Julie Mendez", location: "Memphis, TN, US", online: true, photo: "https://i.pravatar.cc/150?img=9" },
  { id: 2, name: "Marian Montgomery", location: "Newark, NJ, US", online: true, photo: "https://i.pravatar.cc/150?img=14" },
  { id: 3, name: "Joyce Reid", location: "Fort Worth, TX, US", online: false, photo: "https://i.pravatar.cc/150?img=27" },
  { id: 4, name: "Alice Franklin", location: "Springfield, MA, US", online: false, photo: "https://i.pravatar.cc/150?img=31" },
  { id: 5, name: "Domingo Flores", location: "Honolulu, HI, US", online: true, photo: "https://i.pravatar.cc/150?img=53" },
];

const navLinks = [
  { to: "/", label: "Feed", icon: Home },
  { to: "/friend", label: "People", icon: Compass },
  { to: "/profile", label: "Profile", icon: BarChart2 },
  { to: "/message", label: "Message", icon: Send },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/setting", label: "Settings", icon: Settings },
];

const Sidebar = () => {
  const { DBUser, SignOut } = useContext(UserContext);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [followStats, setFollowStats] = useState({ followers: [], following: [] });

  useEffect(() => {
    if (!DBUser?.uid) return;

    axios
      .get(`${import.meta.env.VITE_API_URL}/post/${DBUser.uid}`)
      .then((res) => setPostCount(Array.isArray(res.data) ? res.data.length : 0))
      .catch(() => setPostCount(0));

    axios
      .get(`${import.meta.env.VITE_API_URL}/following/${DBUser.uid}`)
      .then((res) =>
        setFollowStats({
          followers: res.data?.followers || [],
          following: res.data?.following || [],
        }),
      )
      .catch(() => setFollowStats({ followers: [], following: [] }));
  }, [DBUser?.uid]);

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await SignOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <div className="drawer-side z-40">
        <label htmlFor="my-drawer-2" className="drawer-overlay"></label>
        <div className="w-72 bg-base-100 border-r border-dashed border-base-content/10 text-base-content min-h-full flex flex-col px-5 py-6">
          {/* Profile card */}
          <Link to="/profile" className="flex flex-col items-center text-center pb-5">
            <div className="avatar">
              <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img src={DBUser?.photoURL} alt="User" />
              </div>
            </div>
            <h3 className="mt-3 font-semibold text-base">{DBUser?.name}</h3>
            <p className="text-xs text-base-content/50 mt-0.5">
              {DBUser?.address || "—"}
            </p>

            <div className="flex items-center gap-6 mt-4">
              <div className="text-center">
                <p className="font-semibold text-sm">{postCount}</p>
                <p className="text-[11px] text-base-content/50">Posts</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">{followStats.followers.length}</p>
                <p className="text-[11px] text-base-content/50">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">{followStats.following.length}</p>
                <p className="text-[11px] text-base-content/50">Following</p>
              </div>
            </div>
          </Link>

          <div className="divider-dotted"></div>

          {/* Nav links */}
          <ul className="menu p-0 gap-1 py-5">
            {navLinks.map(({ to, label, icon: Icon }, i) => (
              <motion.li
                key={label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.15 }}
              >
                <Link
                  to={to}
                  className="flex items-center gap-3  py-2.5 rounded-xl hover:bg-base-200 hover:text-primary"
                >
                  <Icon className="w-4.5 h-4.5" />
                  {label}
                </Link>
              </motion.li>
            ))}
            <li>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-3 text-sm py-2.5 rounded-xl hover:bg-base-200 hover:text-error w-full text-left"
              >
                <LogOut className="w-4.5 h-4.5" />
                LogOut
              </button>
            </li>
          </ul>

          
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <dialog className={`modal ${showLogoutModal ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg flex items-center gap-2">Confirm Logout</h3>
          <p className="py-4">Are you sure you want to log out of your account?</p>

          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={() => setShowLogoutModal(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </button>

            <button
              className="btn btn-error"
              onClick={handleConfirmLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Logging out...
                </>
              ) : (
                "Yes, Logout"
              )}
            </button>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setShowLogoutModal(false)}>close</button>
        </form>
      </dialog>
    </>
  );
};

export default Sidebar;
