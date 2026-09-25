import { motion } from "framer-motion";
import { useState, useContext, useMemo } from "react";
import { Link } from "react-router";
import axios from "axios";
import toast from "react-hot-toast";
import { MoreHorizontal, MessageCircle, Bookmark, Repeat2, Trash2, Flag } from "lucide-react";
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

  // Pull #hashtags out of the caption so they can be styled like the
  // reference design, without changing what's stored in postText.
  const hashtags = useMemo(() => {
    const matches = (post?.postText || "").match(/#[\p{L}\p{N}_]+/gu);
    return matches ? [...new Set(matches)] : [];
  }, [post?.postText]);

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
          data: { userId: DBUser.uid },
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
      className="bg-base-200 rounded-3xl mb-6 overflow-hidden border border-base-300/60"
    >
      <div className="p-5">
        {/* ========== Header ========== */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-11 rounded-full">
                <Link to={`/otherprofile/${post?.uid}`}>
                  <img src={post?.userPhoto} alt="profile photo" />
                </Link>
              </div>
            </div>
            <div>
              <Link to={`/otherprofile/${post.uid}`}>
                <h3 className="font-semibold text-sm">{post?.userName}</h3>
              </Link>
              <p className="text-xs text-base-content/50">{post?.createAt}</p>
            </div>
          </div>

          {/* ========== Dropdown Menu ========== */}
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
              <MoreHorizontal className="w-4.5 h-4.5" />
            </button>

            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow-lg bg-base-300 rounded-box w-40 z-100 border border-base-content/10"
            >
              <li>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSaveToggle();
                  }}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Bookmark className="w-4 h-4" />
                  {isSaved ? "Unsave" : "Save post"}
                </button>
              </li>

              {DBUser.uid === post.uid && (
                <li>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(post._id);
                    }}
                    className="text-error flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </li>
              )}

              {DBUser.uid !== post.uid && (
                <li>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleReport();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Flag className="w-4 h-4" />
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
            <p className="mt-4 text-[15px] leading-relaxed">
              {preview}...{" "}
              <button
                className="text-primary text-sm hover:underline"
                onClick={() => setIsExpanded(true)}
              >
                read more
              </button>
            </p>
          ) : (
            <p className="mt-4 text-[15px] leading-relaxed">{post?.postText}</p>
          )}

          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-primary text-sm hover:underline"
            >
              Show less
            </button>
          )}

          {hashtags.length > 0 && (
            <p className="mt-2 text-sm text-primary">{hashtags.join(" ")}</p>
          )}
        </div>
      </div>

      {/* ========== Post Image ========== */}
      {post.imageLink && (
        <figure className="px-5">
          <img
            src={post?.imageLink}
            alt="Post"
            className="w-full rounded-2xl object-cover max-h-[500px]"
          />
        </figure>
      )}

      {/* ========== Action Buttons ========== */}
      <div className="flex items-center justify-between px-5 py-4 mt-1">
        <div className="flex items-center gap-5">
          <PostLike post={post} />
          <button
            onClick={() => setIsCommentDiv(!isCommentDiv)}
            className="flex items-center gap-2 text-base-content/70 hover:text-primary text-sm"
          >
            <MessageCircle className="w-5 h-5" />
            {(post?.comments?.length || 0) > 0 ? post.comments.length : "Comment"}
          </button>
          <button className="flex items-center gap-2 text-base-content/70 hover:text-primary text-sm">
            <Repeat2 className="w-5 h-5" />
            Share
          </button>
        </div>

        <button
          onClick={handleSaveToggle}
          disabled={isSaving}
          className={`btn btn-ghost btn-circle btn-sm ${isSaved ? "text-primary" : "text-base-content/60"}`}
        >
          <Bookmark className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} />
        </button>
      </div>

      {isCommentDiv && (
        <div className="px-5 pb-5">
          <CommentPost post={post} />
        </div>
      )}
    </motion.div>
  );
};

export default Posts;
