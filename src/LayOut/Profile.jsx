import { useContext, useEffect, useState } from "react";
import { UserContext } from "../Context/ContextProvider";
import { Link } from "react-router";
import axios from "axios";
import { MapPin, Briefcase, Cake, CalendarDays } from "lucide-react";
import Posts from "../Components/Post/Posts";

const Profile = () => {
  const { DBUser } = useContext(UserContext);
  const [userPosts, setUserPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get User Post
  useEffect(() => {
    // Only fetch if uid exists
    if (!DBUser?.uid) return;

    axios
      .get(`${import.meta.env.VITE_API_URL}/post/${DBUser.uid}`)
      .then((res) => {
        setUserPosts(res.data);
      })
      .catch((err) => {
        console.error("Error fetching posts:", err);
      })
      .finally(() => {
        setLoading(false); // Stop loading regardless of success/error
      });
  }, [DBUser?.uid]);

  // Get Following
  useEffect(() => {
    // Only fetch if uid exists
    if (!DBUser?.uid) return;

    axios
      .get(`${import.meta.env.VITE_API_URL}/following/${DBUser?.uid}`)
      .then((res) => {
        setFollowing(res.data);
      })
      .catch((err) => {
        console.log("Error fetching posts: ", err);
      })
      .finally(() => {
        setLoading(false); // Stop loading regardless of success or error
      });
  }, [DBUser?.uid]);

  return (
    <>
      {loading ? (
        <div className="flex min-h-screen w-full items-center justify-center">
          <span className="loading loading-spinner text-primary loading-lg"></span>
        </div>
      ) : (
        <div className="min-h-screen bg-base-100">
          {/* Cover Photo */}
          <div className="relative h-36 sm:h-48 lg:h-60">
            <img
              src={"https://picsum.photos/2000/500?random=1"}
              alt="Cover"
              className="w-full h-full object-cover rounded-b-3xl"
            />
            {/* Profile Picture - overlapping cover */}
            <div className="absolute -bottom-14 sm:-bottom-16 left-4 sm:left-8 md:left-12 lg:left-20">
              <div className="avatar">
                <div className="w-24 sm:w-32 md:w-40 rounded-full ring-4 sm:ring-8 ring-base-100 shadow-2xl">
                  <img src={DBUser?.photoURL} alt="Profile" className="object-cover" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-12 pt-16 sm:pt-20 pb-12">
            {/* User Info */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{DBUser?.name}</h1>

              {DBUser?.bio && (
                <p className="mt-3 text-base sm:text-lg leading-relaxed max-w-2xl text-base-content/80">
                  {DBUser?.bio}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm sm:text-base text-base-content/60">
                {DBUser?.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    {DBUser.address}
                  </div>
                )}
                {DBUser?.workAt && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    Work at {DBUser.workAt}
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm sm:text-base text-base-content/60">
                {DBUser?.DateOfBirth && (
                  <div className="flex items-center gap-2">
                    <Cake className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    {DBUser.DateOfBirth}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  On LinkUp
                </div>
              </div>

              {/* Follow Stats */}
              <div className="mt-6 flex gap-6 sm:gap-8">
                <div>
                  <span className="font-bold text-lg sm:text-xl">
                    {following?.following?.length ?? 0}
                  </span>
                  <span className="text-base-content/50 ml-2 text-sm sm:text-base">Following</span>
                </div>
                <div>
                  <span className="font-bold text-lg sm:text-xl">
                    {following?.followers?.length ?? 0}
                  </span>
                  <span className="text-base-content/50 ml-2 text-sm sm:text-base">Followers</span>
                </div>
                <div>
                  <span className="font-bold text-lg sm:text-xl">{userPosts?.length ?? 0}</span>
                  <span className="text-base-content/50 ml-2 text-sm sm:text-base">Posts</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-4">
                <Link to={"/editprofile"}>
                  <button className="btn btn-primary btn-sm rounded-full px-10 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2">
                    Edit Profile
                  </button>
                </Link>
              </div>
            </div>

            {/* Tabs for Posts / About / Media */}
            <div className="tabs w-full mt-10 border-b border-dashed border-base-content/10 overflow-x-auto scrollbar-thin flex-nowrap">
              <button className="tab tab-active text-primary border-primary whitespace-nowrap">Posts</button>
              <button className="tab whitespace-nowrap">About</button>
              <button className="tab whitespace-nowrap">Photos</button>
              <button className="tab whitespace-nowrap">Videos</button>
            </div>

            {/* Posts */}
            <div className="mt-6">
              {userPosts?.length === 0 ? (
                <div className="text-center text-base-content/50 py-16">
                  No posts yet.
                </div>
              ) : (
                userPosts?.map((post) => <Posts key={post?._id} post={post} />)
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;