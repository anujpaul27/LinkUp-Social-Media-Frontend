import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { UserContext } from "../Context/ContextProvider";
import { Link } from "react-router-dom"; // optional – remove if not needed

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
    <div className="w-full mx-auto py-4 px-3 sm:px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-base-content flex items-center gap-2">
          🔖 Saved
        </h2>
        <div className="flex gap-2">
          <button className="btn btn-sm btn-ghost rounded-full">All</button>
          {/* You can add more filters later */}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : savedPosts.length === 0 ? (
        <div className="text-center py-16 bg-base-200/50 rounded-2xl">
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
                className="flex gap-3 p-3 rounded-xl bg-base-200/60 hover:bg-base-200 transition-colors border border-base-300/40"
              >
                {/* Left Thumbnail */}
                <div className="relative flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-base-300">
                  {post.imageLink ? (
                    <img
                      src={post.imageLink}
                      alt="post photo "
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-base-content/40">
                      <span className="text-2xl">📄</span>
                    </div>
                  )}

                  {/* Play button for video / reel */}
                  {(post.video ||
                    post.mediaType === "video" ||
                    post.mediaType === "reel") && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5 text-black ml-0.5"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
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
                    <button className="btn btn-sm btn-ghost bg-base-300/60 hover:bg-base-300 rounded-lg text-xs font-medium px-3 h-8 min-h-0">
                      Add to Collection
                    </button>

                    <button className="btn btn-sm btn-ghost btn-square h-8 w-8 min-h-0 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                        />
                      </svg>
                    </button>

                    <button className="btn btn-sm btn-ghost btn-square h-8 w-8 min-h-0 rounded-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                        />
                      </svg>
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
