import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserContext } from "../Context/ContextProvider";
import { Bookmark, PlayCircle, FileText, FolderPlus, Trash2 } from "lucide-react";

const Saved = () => {
  const { DBUser } = useContext(UserContext);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DBUser?._id) {
      fetchSavedPosts();
    }
  }, [DBUser]);

  const fetchSavedPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/user/saved-posts/${DBUser?._id}`,
      );
      if (res.data?.success) {
        setSavedPosts(res.data.savedPosts);
      }
    } catch (error) {
      console.error("Failed to fetch saved posts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper – decide thumbnail
  const getThumbnail = (post) => {
    if (post.video || post.mediaType === "video" || post.mediaType === "reel") {
      return post.thumbnail || post.image || post.media?.[0];
    }
    return post.image || post.media?.[0] || post.user?.photoURL;
  };

  // Helper – decide type label
  const getTypeLabel = (post) => {
    if (post.mediaType === "reel" || post.isReel) return "Reels";
    if (post.mediaType === "video") return "Video";
    return "Post";
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-3 sm:px-4 md:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-dashed border-base-content/10">
        <h2 className="text-lg sm:text-xl font-semibold text-base-content flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" />
          Saved
        </h2>
        <div className="flex gap-2">
          <button className="btn btn-sm btn-primary rounded-full px-4 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
            All
          </button>
          {/* You can add more filters later */}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : savedPosts.length === 0 ? (
        <div className="text-center py-16 bg-base-200/60 rounded-2xl border border-base-300/40">
          <Bookmark className="w-8 h-8 mx-auto text-base-content/30 mb-3" />
          <p className="text-lg font-medium text-base-content/70">
            No saved posts yet!
          </p>
          <p className="text-sm text-base-content/50 mt-1">
            Posts you save will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedPosts.map((post) => {
            const typeLabel = getTypeLabel(post);
            const title = post.postText;
            ("Untitled Post");
            const authorName = post.userName || "Unknown";

            return (
              <div
                key={post._id}
                className="flex gap-3 p-3 rounded-2xl bg-base-200/60 hover:bg-base-200 transition-colors border border-base-300/40"
              >
                {/* Left Thumbnail */}
                <div className="relative shrink-0 w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-base-300">
                  {post.imageLink ? (
                    <img
                      src={post.imageLink}
                      alt="post photo "
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-base-content/40">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}

                  {/* Play button for video / reel */}
                  {(post.video ||
                    post.mediaType === "video" ||
                    post.mediaType === "reel") && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <PlayCircle className="w-9 h-9 text-white/90" />
                    </div>
                  )}

                  {/* Duration (if available) */}
                  {post.duration && (
                    <span className="absolute bottom-1 right-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                      {post.duration}
                    </span>
                  )}
                </div>

                {/* Right Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    {/* Title */}
                    <h3 className="font-medium text-base-content line-clamp-2 leading-snug">
                      {title}
                    </h3>

                    {/* Meta line */}
                    <p className="text-xs text-base-content/60 mt-1">
                      {typeLabel} · {authorName}
                    </p>

                    {/* Saved from */}
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-base-content/50">
                      <div className="w-4 h-4 rounded-full overflow-hidden bg-base-300">
                        {post.user?.photoURL ? (
                          <img
                            src={post.user.photoURL}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/20" />
                        )}
                      </div>
                      <span>Saved from {authorName}'s post</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-3">
                    <button className="btn btn-sm btn-ghost bg-base-300/60 hover:bg-base-300 rounded-lg text-xs font-medium px-3 h-8 min-h-0 gap-1.5 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Add to Collection</span>
                    </button>

                    <button
                      aria-label="Remove from saved"
                      className="btn btn-sm btn-ghost btn-square h-8 w-8 min-h-0 rounded-lg hover:text-error focus-visible:outline-2 focus-visible:outline-error focus-visible:outline-offset-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Saved;