import { useContext, useState } from "react";
import { UserContext } from "../Context/ContextProvider";
import axios from "axios";
import { Settings2, Moon, Lock, CheckCircle2, XCircle } from "lucide-react";

const Setting = () => {
  const { DBUser, setDBUser } = useContext(UserContext);
  const [bio, setBio] = useState(DBUser?.bio || "");
  const [isPrivate, setIsPrivate] = useState(DBUser?.isPrivateAccount || false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

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
        setMessage("success");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
      <h2 className="text-xl sm:text-2xl font-bold mb-6 text-base-content flex items-center gap-2">
        <Settings2 className="w-6 h-6 text-primary" />
        Settings & Preferences
      </h2>

      <div className="bg-base-200 border border-base-300/60 rounded-3xl p-5 sm:p-6 flex flex-col gap-6">
        {/* Appearance */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-dashed border-base-content/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Appearance</h3>
              <p className="text-sm text-base-content/50">
                Dark theme is on app-wide for a consistent LinkUp look.
              </p>
            </div>
          </div>
        </div>

        {/* Account Info Form */}
        <form onSubmit={handleSaveSettings} className="flex flex-col gap-5">
          <div>
            <label className="label px-0">
              <span className="label-text font-medium">Profile Bio</span>
            </label>
            <textarea
              className="textarea w-full bg-base-300/40 border border-base-300 focus:border-primary focus:outline-none rounded-2xl transition-colors"
              placeholder="Write a short bio about yourself..."
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm sm:text-base">Private Account</h4>
                <p className="text-xs sm:text-sm text-base-content/50">
                  Only approved followers can see your posts.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary shrink-0"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
          </div>

          {message && (
            <p
              className={`text-sm font-medium text-center mt-1 flex items-center justify-center gap-1.5 ${
                message === "success" ? "text-success" : "text-error"
              }`}
            >
              {message === "success" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Settings saved successfully!
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" /> Failed to save settings
                </>
              )}
            </p>
          )}

          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary rounded-full px-6 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
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