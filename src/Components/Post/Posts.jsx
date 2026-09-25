import { motion } from "framer-motion";
import { useState, useContext } from "react";
import { Link } from "react-router";
import axios from "axios";
import toast from "react-hot-toast";
import PostLike from "./PostLike";
import CommentPost from "./CommentPost";
import { UserContext } from "../../Context/ContextProvider";

const Posts = ({ post, onAction }) => {
  const { DBUser } = useContext(UserContext);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCommentDiv, setIsCommentDiv] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(post?.isSaved || false); // if your API returns this

  const words = (post?.postText || "").split(" ");
  const preview = words.slice(0, 20).join(" ");

  // ========== Save / Unsave ==========
  const handleSaveToggle = async () => {
    if (!DBUser?._id) {
      toast.error("Please login first");
      return;
    }

    try {
      setIsSaving(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/save-post`,
        {
          userId: DBUser._id,
          postId: post._id,
        },
      );

      if (res.data?.success) {
        setIsSaved(!isSaved);
        toast.success(isSaved ? "Removed from Saved" : "Post Saved");
        if (onAction) onAction(); // optional refresh
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save/unsave post");
    } finally {
      setIsSaving(false);
    }
  };

  // ========== Delete ==========
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/posts/delete/${id}`,
        {
          data: { userId: DBUser?.uid },
        },
      );

      if (res.data?.success) {
        toast.success("Post deleted successfully");
        if (onAction) onAction(); // remove from list
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete post");
    }
  };

  // ========== Report ==========
  const handleReport = async () => {
    if (!DBUser?._id) {
      toast.error("Please login first");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/posts/report`,
        {
          postId: post._id,
          reportedBy: DBUser._id,
          reason: "Inappropriate content",
        },
      );

      if (res.data?.success) {
        toast.success("Post reported. Thank you!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to report post");
    }
  };

  return (
    <motion.div
      key={post._id}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card bg-base-100 shadow-xl mb-6 hover:shadow-2xl transition-shadow"
    >
      <div className="card-body">
        {/* ========== Header ========== */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-12 rounded-full">
                <Link to={`/otherprofile/${post?.uid}`}>
                  <img src={post?.userPhoto} alt="profile photo" />
                </Link>
              </div>
            </div>
            <div>
              <Link to={`/otherprofile/${post?.uid}`}>
                <h3 className="font-semibold">{post?.userName}</h3>
              </Link>
              <p className="lg:text-sm md:text-sm text-[10px] opacity-70">
                {post?.createAt} · 🌐
              </p>
            </div>
          </div>

          {/* ========== ⋯ Dropdown Menu ========== */}
          <div className="dropdown dropdown-end">
            {/* Trigger Button */}
            <button
              tabIndex={0}
              className="btn btn-ghost btn-sm btn-circle m-1"
            >
              ⋯
            </button>

            {/* Dropdown Content */}
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow-lg bg-base-200 rounded-box w-30 z-100 border border-base-300"
            >
              {/* Save / Unsave */}
              <li>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSaveToggle();
                  }}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaved ? <>Unsave</> : <>Save post</>}
                </button>
              </li>

              {/* Delete - only for owner */}
              {DBUser.uid === post?.uid && (
                <li>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(post._id);
                    }}
                    className="text-error flex items-center gap-2"
                  >
                    Delete
                  </button>
                </li>
              )}

              {/* Report - only for non-owner */}
              {DBUser?.uid !== post?.uid && (
                <li>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleReport();
                    }}
                    className=" flex items-center gap-2"
                  >
                    Report
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* ========== Post Text ========== */}
        <div>
          {!isExpanded && words.length > 21 ? (
            <p className="mt-4 lg:text-[15px] md:text-md text-sm">
              {preview}...{" "}
              <button
                className="text-blue-500 text-sm hover:underline"
                onClick={() => setIsExpanded(true)}
              >
                Read more
              </button>
            </p>
          ) : (
            <p className="mt-4 lg:text-[15px] md:text-md text-sm">
              {post?.postText}
            </p>
          )}

          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-blue-500 hover:underline"
            >
              Show less
            </button>
          )}
        </div>

        {/* ========== Post Image ========== */}
        {post.imageLink && (
          <figure className="mt-4">
            <img
              src={post?.imageLink}
              alt="Post"
              className="w-full rounded-xl object-cover max-h-[500px]"
            />
          </figure>
        )}

        {/* ========== Action Buttons ========== */}
        <div className="flex justify-between mt-4 pt-4 border-t">
          <button className="btn btn-ghost flex-1 gap-2">
            <PostLike post={post} />
          </button>
          <button
            onClick={() => setIsCommentDiv(!isCommentDiv)}
            className="btn btn-ghost flex-1 gap-2"
          >
            💬 Comment
          </button>
          <button className="btn btn-ghost flex-1 gap-2">🔄 Share</button>
        </div>

        {isCommentDiv && <CommentPost post={post} />}
      </div>
    </motion.div>
  );
};

export default Posts;
