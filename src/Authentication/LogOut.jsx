import React, { useContext, useState } from "react";
import { UserContext } from "../Context/ContextProvider";
import { useNavigate } from "react-router";

const LogOut = () => {
  const { SignOut } = useContext(UserContext);
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await SignOut();          // wait if SignOut is async
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // go back to previous page
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      {/* Confirmation Modal */}
      <dialog className="modal modal-open">
        <div className="modal-box">
          <h3 className="font-bold text-lg flex items-center gap-2">
            🔒 Confirm Logout
          </h3>
          <p className="py-4 text-base-content/80">
            Are you sure you want to log out of your account?
          </p>

          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={handleCancel}
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

        {/* Backdrop - clicking outside also cancels */}
        <form method="dialog" className="modal-backdrop">
          <button onClick={handleCancel}>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default LogOut;