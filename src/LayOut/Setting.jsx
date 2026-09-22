import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../Context/ContextProvider";
import axios from "axios";

const Setting = () => {
  const { DBUser, setDBUser } = useContext(UserContext);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [bio, setBio] = useState(DBUser?.bio || "");
  const [isPrivate, setIsPrivate] = useState(DBUser?.isPrivateAccount || false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleThemeChange = (e) => {
    setTheme(e.target.checked ? "dark" : "light");
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/user/settings`,
        {
          userId: DBUser?._id,
          bio,
          isPrivateAccount: isPrivate,
        },
      );

      if (res.data?.success) {
        setDBUser(res.data.user);
        setMessage("Settings saved successfully! ✅");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("Failed to save settings ❌");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className=" w-full  mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6 text-base-content flex items-center gap-2">
        ⚙️ Settings & Preferences
      </h2>

      <div className="bg-base-100 border border-base-300 shadow-md rounded-xl p-6 flex flex-col gap-6">
        {/* Theme Settings */}
        <div className="flex items-center justify-between pb-4 border-b border-base-200">
          <div>
            <h3 className="font-semibold text-lg">Appearance</h3>
            <p className="text-sm text-base-content/60">
              Toggle between Light and Dark mode
            </p>
          </div>
          <label className="swap swap-rotate btn btn-ghost btn-circle">
            <input
              type="checkbox"
              onChange={handleThemeChange}
              checked={theme === "dark"}
            />
            {/* Sun Icon */}
            <span className="text-2xl">🌞</span>
            {/* Moon Icon */}
            <span className="text-2xl">🌙</span>
          </label>
        </div>

        {/* Account Info Form */}
        <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
          <div>
            <label className="label">
              <span className="label-text font-medium">Profile Bio</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full focus:outline-none"
              placeholder="Write a short bio about yourself..."
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <h4 className="font-medium">Private Account</h4>
              <p className="text-xs text-base-content/60">
                Only approved followers can see your posts.
              </p>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
          </div>

          {message && (
            <p className="text-sm font-medium text-center text-primary mt-2">
              {message}
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary rounded-full px-6"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Setting;
