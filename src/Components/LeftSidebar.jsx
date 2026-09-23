import { motion } from "framer-motion";
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router";
import { UserContext } from "../Context/ContextProvider";

const Sidebar = ({ darkMode, setDarkMode }) => {
  const { DBUser, SignOut } = useContext(UserContext);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
        <ul className="menu p-4 w-70 bg-base-300 text-base-content min-h-full flex flex-col justify-between">
          
          {/* Logo / User Info */}
          <div className="mb-8">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="avatar">
                <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src={DBUser?.photoURL} alt="User" />
                </div>
              </div>
              <span className="font-bold text-xl">{DBUser?.name}</span>
            </div>
          </div>

          <div className="flex-1">
            {/* Home */}
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.0, duration: 0.1 }}
            >
              <Link to="/" className="flex items-center gap-4 text-lg py-3">
                <span className="text-2xl">🏠</span>
                Home
              </Link>
            </motion.li>

            {/* Friend */}
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.1 }}
            >
              <Link to="/friend" className="flex items-center gap-4 text-lg py-3">
                <span className="text-2xl">👥</span>
                Friend
              </Link>
            </motion.li>

            {/* Profile */}
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.1 }}
            >
              <Link to="/profile" className="flex items-center gap-4 text-lg py-3">
                <span className="text-2xl">👤</span>
                Profile
              </Link>
            </motion.li>

            {/* Message */}
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.1 }}
            >
              <Link to="/message" className="flex items-center gap-4 text-lg py-3">
                <span className="text-2xl">💬</span>
                Message
              </Link>
            </motion.li>

            {/* Saved */}
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.1 }}
            >
              <Link to="/saved" className="flex items-center gap-4 text-lg py-3">
                <span className="text-2xl">⭐</span>
                Saved
              </Link>
            </motion.li>

            {/* Setting */}
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.1 }}
            >
              <Link to="/setting" className="flex items-center gap-4 text-lg py-3">
                <span className="text-2xl">⚙️</span>
                Setting
              </Link>
            </motion.li>

            {/* ========== LogOut Button ========== */}
            <motion.li
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.1 }}
            >
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-4 text-lg py-3 w-full text-left"
              >
                <span className="text-2xl">🔒</span>
                LogOut
              </button>
            </motion.li>
          </div>

          {/* Dark Mode Toggle */}
          <div className="mt-8 px-4">
            <label className="label cursor-pointer justify-start gap-3">
              <span className="label-text text-lg">Dark Mode</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
            </label>
          </div>
        </ul>
      </div>

      {/* ========== Logout Confirmation Modal ========== */}
      <dialog className={`modal ${showLogoutModal ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg flex items-center gap-2">
            🔒 Confirm Logout
          </h3>
          <p className="py-4">
            Are you sure you want to log out of your account?
          </p>

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

        {/* Click outside to close */}
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setShowLogoutModal(false)}>close</button>
        </form>
      </dialog>
    </>
  );
};

export default Sidebar;