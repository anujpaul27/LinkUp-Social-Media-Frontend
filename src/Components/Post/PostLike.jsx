import { useContext, useState } from "react";
import axios from "axios";
import { Heart } from "lucide-react";
import { UserContext } from "../../Context/ContextProvider";

const PostLike = ({ post }) => {
  // logged in user can like the post
  const { DBUser } = useContext(UserContext);
  const currentUserId = DBUser._id;

  const [likes, setLikes] = useState(post.like);
  const isLikedByMe = likes.includes(currentUserId);

  const handleLikeToggle = async () => {
    try {
      // Optimistic UI update (optional, but makes app feel instantly fast)
      const updatedLikes = isLikedByMe
        ? likes.filter((id) => id !== currentUserId)
        : [...likes, currentUserId];
      setLikes(updatedLikes);

      // Send requests to backend
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/post/like`,
        {
          userId: currentUserId,
          postId: post._id,
        },
      );

      if (response.data.success) {
        // Sync with exact server response just to be sure
        setLikes(response.data.likeList);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert state if backend request fails
      setLikes(post.like);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <button
      onClick={handleLikeToggle}
      className={`flex items-center gap-2 text-sm cursor-pointer ${
        isLikedByMe ? "text-error" : "text-base-content/70 hover:text-error"
      }`}
    >
      <Heart className="w-5 h-5" fill={isLikedByMe ? "currentColor" : "none"} />
      <span>
        {likes.length} {likes.length === 1 ? "Like" : "likes"}
      </span>
    </button>
  );
};

export default PostLike;
