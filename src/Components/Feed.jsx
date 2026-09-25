import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Posts from "./Post/Posts";
import Stories from "./Stories";

const Feed = () => {
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("popular"); // "popular" | "latest"

  // Get all post
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/post`)
      .then((res) => setAllPosts(res.data))
      .catch((error) => console.log("Error from get posts.", error.message))
      .finally(() => setLoading(false));
  }, []);

  const visiblePosts = useMemo(() => {
    const posts = [...allPosts];
    if (activeTab === "popular") {
      return posts.sort((a, b) => (b?.like?.length || 0) - (a?.like?.length || 0));
    }
    // "latest" — respect the order the API already returns (newest first)
    return posts;
  }, [allPosts, activeTab]);

  return (
    <div className="flex-1 max-w-2xl mx-auto lg:px-4 md:px-4 px-3 pt-6">
      <Stories />

      {/* Feeds header + filters */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Feeds</h2>
        <div className="inline-flex bg-base-200 rounded-full p-1 gap-1">
          <button
            onClick={() => setActiveTab("popular")}
            className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
              activeTab === "popular"
                ? "bg-primary text-primary-content font-medium"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            Popular
          </button>
          <button
            onClick={() => setActiveTab("latest")}
            className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
              activeTab === "latest"
                ? "bg-primary text-primary-content font-medium"
                : "text-base-content/60 hover:text-base-content"
            }`}
          >
            Latest
          </button>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex min-h-[40vh] w-full items-center justify-center">
          <span className="loading loading-spinner text-primary loading-lg"></span>
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="text-center text-base-content/50 py-16">
          No posts yet. Be the first to share something!
        </div>
      ) : (
        visiblePosts.map((post) => <Posts key={post._id} post={post}></Posts>)
      )}
    </div>
  );
};

export default Feed;
