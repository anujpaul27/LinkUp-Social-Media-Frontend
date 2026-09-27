import { useContext, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, X } from "lucide-react";
import axios from "axios";
import { UserContext } from "../Context/ContextProvider";

// Deterministic gradient ring per user so the same person always gets the
// same colour (purely cosmetic, mirrors the reference design).
const RING_GRADIENTS = [
  "from-fuchsia-500 via-pink-500 to-amber-400",
  "from-sky-400 via-blue-500 to-indigo-500",
  "from-rose-500 via-red-500 to-orange-400",
  "from-emerald-400 via-teal-500 to-cyan-500",
  "from-amber-400 via-orange-500 to-rose-500",
  "from-violet-500 via-purple-500 to-fuchsia-500",
];

const ringFor = (uid = "") => {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash + uid.charCodeAt(i)) % RING_GRADIENTS.length;
  return RING_GRADIENTS[hash];
};

const STORY_DURATION_MS = 5000;

const Stories = () => {
  const { DBUser } = useContext(UserContext);
  const [groups, setGroups] = useState([]); // [{ uid, userName, userPhoto, stories: [...] }]
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewerGroupIndex, setViewerGroupIndex] = useState(null);
  const [viewerStoryIndex, setViewerStoryIndex] = useState(0);
  const railRef = useRef(null);
  const fileInputRef = useRef(null);
  const progressTimeout = useRef(null);

  const fetchStories = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/story/all`);
      const stories = res.data || [];

      // Group flat story list into one entry per author, newest first.
      const byUser = new Map();
      stories.forEach((story) => {
        if (!byUser.has(story.uid)) {
          byUser.set(story.uid, {
            uid: story.uid,
            userName: story.userName,
            userPhoto: story.userPhoto,
            stories: [],
          });
        }
        byUser.get(story.uid).stories.push(story);
      });

      // Current user's own group (if any) always leads the rail.
      const grouped = Array.from(byUser.values());
      grouped.sort((a, b) => (a.uid === DBUser?.uid ? -1 : b.uid === DBUser?.uid ? 1 : 0));
      setGroups(grouped);
    } catch (error) {
      console.error("Error fetching stories:", error.message);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
    // Refresh periodically so newly-expired (24h) stories drop off the rail.
    const interval = setInterval(fetchStories, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DBUser?.uid]);

  // Lock body scroll on mobile/desktop when story viewer modal is open
  useEffect(() => {
    if (viewerGroupIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [viewerGroupIndex]);

  const handleAddStoryClick = () => fileInputRef.current?.click();

  const handleAddStory = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file || !DBUser?.uid) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      const uploadRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/image-upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const mediaLink = uploadRes.data?.url;
      if (!mediaLink) throw new Error("Upload failed");

      await axios.post(`${import.meta.env.VITE_API_URL}/api/story/create`, {
        uid: DBUser.uid,
        userName: DBUser.name,
        userPhoto: DBUser.photoURL,
        mediaLink,
        mediaType: "image",
      });

      await fetchStories();
    } catch (error) {
      console.error("Error posting story:", error.message);
    } finally {
      setUploading(false);
    }
  };

  // ---------- Rail scroll buttons (desktop) ----------
  const scrollRail = (dir) => {
    railRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  };

  // ---------- Story viewer ----------
  const openViewer = (groupIndex) => {
    setViewerGroupIndex(groupIndex);
    setViewerStoryIndex(0);
  };
  const closeViewer = () => setViewerGroupIndex(null);

  const activeGroup = viewerGroupIndex !== null ? groups[viewerGroupIndex] : null;
  const activeStory = activeGroup?.stories?.[viewerStoryIndex];

  const goNext = () => {
    if (!activeGroup) return;
    if (viewerStoryIndex < activeGroup.stories.length - 1) {
      setViewerStoryIndex((i) => i + 1);
    } else if (viewerGroupIndex < groups.length - 1) {
      setViewerGroupIndex((g) => g + 1);
      setViewerStoryIndex(0);
    } else {
      closeViewer();
    }
  };
  const goPrev = () => {
    if (viewerStoryIndex > 0) {
      setViewerStoryIndex((i) => i - 1);
    } else if (viewerGroupIndex > 0) {
      setViewerGroupIndex((g) => g - 1);
      setViewerStoryIndex(0);
    }
  };

  // Auto-advance timer while the viewer is open
  useEffect(() => {
    if (viewerGroupIndex === null) return;
    clearTimeout(progressTimeout.current);
    progressTimeout.current = setTimeout(goNext, STORY_DURATION_MS);
    return () => clearTimeout(progressTimeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerGroupIndex, viewerStoryIndex]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Stories</h2>
        {groups.length > 0 && (
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => scrollRail(-1)}
              aria-label="Scroll stories left"
              className="btn btn-ghost btn-circle btn-xs focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollRail(1)}
              aria-label="Scroll stories right"
              className="btn btn-ghost btn-circle btn-xs focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={railRef}
        className="w-full min-w-0 flex items-start gap-3 sm:gap-4 overflow-x-auto scroll-mb-1 [::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory pb-1 -mx-3 px-3 sm:-mx-1 sm:px-1"
      >
        {/* Add story */}
        <div className="flex flex-col items-center gap-2 shrink-0 snap-start">
          <button
            onClick={handleAddStoryClick}
            disabled={uploading}
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-base-content/30 flex items-center justify-center bg-base-200 hover:border-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 cursor-pointer"
          >
            {DBUser?.photoURL ? (
              <img
                src={DBUser.photoURL}
                alt="Add story"
                className="w-full h-full rounded-full object-cover opacity-60"
              />
            ) : null}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center ring-2 ring-base-100">
              {uploading ? (
                <span className="loading loading-spinner loading-xs text-primary-content"></span>
              ) : (
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-content" />
              )}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAddStory}
          />
          <span className="text-[11px] sm:text-xs text-base-content/60">Add story</span>
        </div>

        {loading ? (
          [...Array(15)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0 snap-start">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-base-200 animate-pulse" />
              <div className="w-10 h-2.5 rounded bg-base-200 animate-pulse" />
            </div>
          ))
        ) : (
          groups.map((group, i) => (
            <motion.button
              key={group.uid}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.05 }}
              onClick={() => openViewer(i)}
              className="flex flex-col items-center gap-2 shrink-0 snap-start focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 rounded-2xl cursor-pointer"
            >
              <span className={`block w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${ringFor(group.uid)} p-[2px]`}>
                <span className="block w-full h-full rounded-full ring-2 ring-base-100 overflow-hidden">
                  <img src={group.userPhoto} alt={group.userName} className="w-full h-full object-cover" />
                </span>
              </span>
              <span className="text-[11px] sm:text-xs text-base-content/70 max-w-[64px] sm:max-w-[72px] truncate text-center">
                {group.uid === DBUser?.uid ? "Your story" : group.userName}
              </span>
            </motion.button>
          ))
        )}

        {!loading && groups.length === 0 && (
          <p className="text-sm text-base-content/40 self-center py-4">
            No stories in the last 24h — be the first to share one!
          </p>
        )}
      </div>

      {/* ---------- Full-screen / Modal story viewer ---------- */}
      <AnimatePresence>
        {activeGroup && activeStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black sm:bg-black/90 flex items-center justify-center p-0 sm:p-4 touch-none select-none"
            onClick={closeViewer}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.y) > 100 || Math.abs(info.velocity.y) > 500) {
                  closeViewer();
                }
              }}
              className="relative w-full h-[100dvh] sm:h-[80vh] max-w-none sm:max-w-sm rounded-none sm:rounded-2xl overflow-hidden bg-base-300 flex flex-col justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress bars */}
              <div className="absolute top-2 left-2 right-2 flex gap-1 z-30 pointer-events-none">
                {activeGroup.stories.map((_, idx) => (
                  <div key={idx} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                    <div
                      className={`h-full bg-white ${
                        idx < viewerStoryIndex ? "w-full" : idx === viewerStoryIndex ? "" : "w-0"
                      }`}
                      style={
                        idx === viewerStoryIndex
                          ? { animation: `linkup-story-progress ${STORY_DURATION_MS}ms linear forwards` }
                          : undefined
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-4 sm:top-5 left-3 right-3 flex items-center justify-between z-30 pointer-events-auto">
                <div className="flex items-center gap-2 bg-black/40 sm:bg-transparent backdrop-blur-xs sm:backdrop-blur-none px-2.5 py-1 sm:p-0 rounded-full">
                  <img
                    src={activeGroup.userPhoto}
                    alt={activeGroup.userName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white/60"
                  />
                  <span className="text-white text-sm font-medium drop-shadow-sm truncate max-w-[160px] sm:max-w-[200px]">
                    {activeGroup.userName}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeViewer();
                  }}
                  aria-label="Close story"
                  className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 active:scale-95 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Media image */}
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <img
                  src={activeStory.mediaLink}
                  alt="story"
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>

              {/* Tap navigation zones */}
              <div className="absolute top-16 bottom-0 left-0 right-0 flex z-20 pointer-events-auto">
                <button
                  aria-label="Previous story"
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev();
                  }}
                  className="w-1/2 h-full cursor-pointer focus:outline-none"
                />
                <button
                  aria-label="Next story"
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                  className="w-1/2 h-full cursor-pointer focus:outline-none"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes linkup-story-progress { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  );
};

export default Stories;
