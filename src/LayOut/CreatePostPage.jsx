import { useContext, useState } from "react";
import { motion } from "framer-motion";
import { ImagePlus, Sparkles, X } from "lucide-react";
import { UserContext } from "../Context/ContextProvider";
import axios from "axios";

const CreatePost = () => {
  const [postText, setPostText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false); // AI Loading State
  const { DBUser } = useContext(UserContext);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Helper Function (Text Polish & Image Caption)
  const handleAiGeneration = async (type) => {
    try {
      setIsAiGenerating(true);

      let payload = { type };

      if (type === "text") {
        if (!postText.trim()) return;
        payload.text = postText;
      } else if (type === "image") {
        if (!previewImage) return;
        // previewImage contains base64 DataURL
        const base64Data = previewImage.split(",")[1];
        const mimeType = selectedImage?.type || "image/jpeg";
        payload.base64Image = base64Data;
        payload.mimeType = mimeType;
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/post/ai-generate`,
        payload,
      );

      if (res.data?.success) {
        setPostText(res.data.content);
      }
    } catch (error) {
      console.error("AI Generation Failed:", error);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const UploadImage = async () => {
    if (!selectedImage) return "";
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/image-upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return res.data?.url || "";
    } catch (error) {
      console.error("Image upload failed:", error);
      return "";
    }
  };

  const PostUploadToDataBase = async (imageLink = "") => {
    const createPost = {
      uid: DBUser?.uid,
      userName: DBUser?.name,
      userPhoto: DBUser?.photoURL,
      postText,
      imageLink,
      like: [],
    };

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/post`,
        createPost,
      );
      return res.data;
    } catch (error) {
      console.error("Create post unsuccessful:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!postText.trim() && !selectedImage) return;
    setIsSubmitting(true);

    const imageLink = await UploadImage();
    await PostUploadToDataBase(imageLink);

    setIsSubmitting(false);
    setPostText("");
    setSelectedImage(null);
    setPreviewImage(null);
    alert("Your Post is Successful!");
  };

  return (
    <div className={`max-w-2xl mx-auto my-4 sm:my-6 px-3 sm:px-4 ${isSubmitting ? "loading" : ""}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-base-200 rounded-3xl overflow-hidden border border-base-300/60"
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-4 border-b border-dashed border-base-content/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="avatar shrink-0">
              <div className="w-10 rounded-full ring ring-primary/50 ring-offset-base-200 ring-offset-2">
                <img src={DBUser?.photoURL} alt="Your profile" />
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{DBUser?.name}</h3>
              <p className="text-xs text-base-content/50">Public post</p>
            </div>
          </div>

          {/* AI Text Button ( if text exists & no image caption active ) */}
          {postText.trim() && !previewImage && (
            <button
              type="button"
              onClick={() => handleAiGeneration("text")}
              disabled={isAiGenerating}
              className="btn btn-xs btn-outline btn-primary rounded-full gap-1 shrink-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isAiGenerating ? "Polishing..." : "Write with AI"}
            </button>
          )}
        </div>

        {/* Post Input Area */}
        <div className="p-4 sm:p-5">
          <textarea
            className="textarea w-full min-h-[120px] text-base sm:text-lg placeholder:text-base-content/40 focus:outline-none resize-none bg-transparent border-none p-0"
            placeholder="What's on your mind?"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            rows={4}
          />

          {/* Image Preview */}
          {previewImage && (
            <div className="relative mt-4 rounded-2xl overflow-hidden border border-base-300">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full max-h-96 object-contain bg-base-300/40"
              />

              {/* Image AI Caption Button */}
              <button
                type="button"
                onClick={() => handleAiGeneration("image")}
                disabled={isAiGenerating}
                className="btn btn-sm btn-primary absolute bottom-3 left-3 right-14 sm:right-auto rounded-full shadow-lg gap-1.5 disabled:bg-primary disabled:bg-opacity-70 disabled:text-primary-content focus-visible:outline-2 focus-visible:outline-primary-content focus-visible:outline-offset-2"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {isAiGenerating ? "Generating..." : "Create AI caption from image"}
                </span>
              </button>

              <button
                onClick={() => {
                  setPreviewImage(null);
                  setSelectedImage(null);
                }}
                aria-label="Remove image"
                className="btn btn-circle btn-error btn-sm absolute top-2 right-2 focus-visible:outline-2 focus-visible:outline-error focus-visible:outline-offset-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-4 sm:px-5 py-3 border-t border-dashed border-base-content/10 flex items-center justify-between gap-3 bg-base-300/20">
          <label className="flex items-center gap-2 cursor-pointer hover:bg-base-300 p-2 rounded-xl transition-colors text-sm sm:text-base text-base-content/80">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <ImagePlus className="w-5 h-5 text-primary" />
            <span className="hidden xs:inline sm:inline">Photo/Video</span>
          </label>

          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              isAiGenerating ||
              (!postText.trim() && !previewImage)
            }
            className="btn btn-primary px-6 sm:px-8 rounded-full sm:min-w-[120px] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CreatePost;