import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserPlus } from "lucide-react";
import { UserContext } from "../Context/ContextProvider";

// NOTE: There is no "friend requests" or "suggested users" endpoint yet,
// so both lists below are mock/placeholder content for the visual
// redesign. Wire them to real endpoints once those features exist.
const mockRequests = [
  { id: 1, name: "Lauralee Quintero", location: "wants to add you to friends", photo: "https://i.pravatar.cc/150?img=25" },
  { id: 2, name: "Brittni Landoma", location: "wants to add you to friends", photo: "https://i.pravatar.cc/150?img=36" },
];

const mockSuggestions = [
  { id: 1, name: "Chantal Shelburne", location: "Memphis, TN, US", photo: "https://i.pravatar.cc/150?img=41" },
  { id: 2, name: "Marci Senter", location: "Newark, NJ, US", photo: "https://i.pravatar.cc/150?img=48" },
  { id: 3, name: "Janetta Rotolo", location: "Fort Worth, TX, US", photo: "https://i.pravatar.cc/150?img=15" },
  { id: 4, name: "Tyra Dhillon", location: "Springfield, MA, US", photo: "https://i.pravatar.cc/150?img=19" },
  { id: 5, name: "Marielle Wigington", location: "Honolulu, HI, US", photo: "https://i.pravatar.cc/150?img=57" },
];

const footerLinks = ["About", "Accessibility", "Help Center", "Privacy and Terms", "Advertising", "Business Services"];

const RightBar = () => {
  const { DBUser } = useContext(UserContext);
  const [requests, setRequests] = useState(mockRequests);
  const [followedIds, setFollowedIds] = useState([]);
  const [followerCount, setFollowerCount] = useState(null);

  useEffect(() => {
    if (!DBUser?.uid) return;
    axios
      .get(`${import.meta.env.VITE_API_URL}/following/${DBUser.uid}`)
      .then((res) => setFollowerCount(res.data?.followers?.length ?? 0))
      .catch(() => setFollowerCount(null));
  }, [DBUser?.uid]);

  const handleRequest = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleFollow = (id) => {
    setFollowedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  return (
    <div className="hidden xl:flex xl:flex-col w-80 shrink-0 px-4 pt-6 pb-6 sticky top-16 h-fit max-h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin">
      {/* Friend Requests */}
      {requests.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold">Requests</h2>
            <span className="badge badge-primary badge-sm">{requests.length}</span>
          </div>
          <div className="space-y-4">
            {requests.map((r) => (
              <div key={r.id} className="flex gap-3">
                <img src={r.photo} alt={r.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm leading-snug">
                    <span className="font-semibold">{r.name}</span> {r.location}
                  </p>
                  <div className="flex gap-4 mt-1.5">
                    <button
                      onClick={() => handleRequest(r.id)}
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRequest(r.id)}
                      className="text-base-content/50 text-sm hover:underline"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="divider-dotted my-5"></div>
        </div>
      )}

      {/* Suggestions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Suggestions for you</h2>
        <div className="space-y-3.5">
          {mockSuggestions.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <img src={s.photo} alt={s.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-base-content/50 truncate">{s.location}</p>
              </div>
              <button
                onClick={() => handleFollow(s.id)}
                disabled={followedIds.includes(s.id)}
                className={`btn btn-circle btn-xs ${
                  followedIds.includes(s.id) ? "btn-disabled" : "btn-ghost text-primary"
                }`}
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button className="block text-sm text-primary hover:underline mt-3">View All</button>
      </div>

      <div className="divider-dotted my-5"></div>

      {/* Active followers widget */}
      <div className="bg-base-200 rounded-2xl p-4">
        <div className="flex -space-x-2 mb-3">
          {mockSuggestions.slice(0, 5).map((s) => (
            <img
              key={s.id}
              src={s.photo}
              alt=""
              className="w-8 h-8 rounded-full object-cover ring-2 ring-base-200"
            />
          ))}
        </div>
        <p className="font-semibold text-sm">
          {followerCount !== null ? followerCount.toLocaleString() : "—"}{" "}
          <span className="font-normal text-base-content/60">Followers</span>
        </p>
        <p className="text-xs text-base-content/50">Active now on your profile</p>
      </div>

      {/* Footer */}
      <div className="mt-6 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-base-content/40">
        {footerLinks.map((label) => (
          <span key={label} className="hover:text-base-content/70 cursor-pointer">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default RightBar;
