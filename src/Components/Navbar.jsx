import { useContext } from "react";
import { UserContext } from "../Context/ContextProvider";
import { Link } from "react-router";
import { Bell, Home, Users, User, MessageCircle, Menu, Plus } from "lucide-react";
import SearchUser from "./SearchUser";

const Navbar = () => {
  const { DBUser } = useContext(UserContext);

  return (
    <>
      <section className="navbar bg-base-100/95 backdrop-blur border-b border-dashed border-base-content/10 sticky top-0 z-20 w-full gap-3 px-3 lg:px-6">
        {/* Mobile drawer toggle */}
        <label htmlFor="my-drawer-2" className="btn btn-ghost btn-circle lg:hidden">
          <Menu className="w-5 h-5" />
        </label>

        {/* Logo (compact) */}
        <Link to="/" className="hidden lg:flex items-center gap-2 shrink-0">
          <img className="w-7" src="/LinkUpLogo.png" alt="LinkUp" />
          <span className="text-lg font-bold text-base-content">LinkUp</span>
        </Link>

        {/* Search */}
        <div className="flex-1 flex justify-center">
          <SearchUser />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/CreatePost"
            className="btn btn-primary rounded-full gap-2 hidden sm:flex"
          >
            <Plus className="w-4 h-4" />
            Create new post
          </Link>
          <Link to="/CreatePost" className="btn btn-primary btn-circle sm:hidden">
            <Plus className="w-5 h-5" />
          </Link>

          <button className="btn btn-ghost btn-circle">
            <div className="indicator">
              <Bell className="w-5 h-5" />
              <span className="badge badge-xs badge-primary indicator-item"></span>
            </div>
          </button>

          <Link to="/profile" className="avatar hidden lg:block">
            <div className="w-9 rounded-full ring ring-primary/40 ring-offset-base-100 ring-offset-2">
              <img src={DBUser?.photoURL} alt="Profile" />
            </div>
          </Link>
        </div>
      </section>

      {/* Mobile bottom nav */}
      <div className="flex justify-between fixed bg-base-200 border-t border-base-300 bottom-0 w-full z-30 shadow-md items-center px-8 py-2 lg:hidden">
        <Link to="/" className="btn btn-ghost btn-circle btn-sm">
          <Home className="w-5 h-5" />
        </Link>
        <Link to="/friend" className="btn btn-ghost btn-circle btn-sm">
          <Users className="w-5 h-5" />
        </Link>
        <Link to="/profile" className="btn btn-ghost btn-circle btn-sm">
          <User className="w-5 h-5" />
        </Link>
        <Link to="/message" className="btn btn-ghost btn-circle btn-sm">
          <MessageCircle className="w-5 h-5" />
        </Link>
      </div>
    </>
  );
};

export default Navbar;
