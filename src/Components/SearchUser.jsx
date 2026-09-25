import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Search, Mic } from "lucide-react";

const SearchUser = () => {
  const [users, setUsers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredUsers, setFilterUser] = useState([]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/user`, { withCredentials: true })
      .then((res) => {
        setUsers(res.data || []);
      })
      .catch((error) => {
        console.error("Error fetching users:", error.message);
        setUsers([]);
      });
  }, []);

  function startFilter(val) {
    // if value is a empty return function
    if (!val.trim()) {
      setFilterUser([]);
      return;
    }
    const filteredUser = users.filter((user) =>
      user.name.toLowerCase().includes(val.toLowerCase()),
    );
    setFilterUser(filteredUser);
  }

  return (
    <div className="relative w-full max-w-md">
      {/* Input Box */}
      <div className="flex items-center gap-2 bg-base-200 border border-base-300 rounded-full px-4 py-2.5">
        <Search className="w-4 h-4 text-base-content/50 shrink-0" />
        <input
          type="text"
          placeholder="Search..."
          onKeyUp={(e) => startFilter(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // dropdown hide delay
          className="bg-transparent outline-none w-full text-sm placeholder:text-base-content/40"
        />
        <Mic className="w-4 h-4 text-base-content/40 shrink-0" />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute mt-2 w-full bg-base-200 border border-base-300 shadow-xl rounded-2xl z-10 overflow-hidden">
          {filteredUsers.length > 0 ? (
            filteredUsers?.map((user) => (
              <div key={user.uid} className="p-2 hover:bg-base-300 cursor-pointer">
                <Link className="flex gap-2 items-center" to={`/otherprofile/${user?.uid}`}>
                  <img
                    className="lg:w-12 lg:h-12 w-10 h-10 rounded-full object-cover"
                    src={user?.photoURL}
                    alt="profile photo"
                  />
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-base-content/50 truncate mt-0.5">
                      From {user?.address}
                    </p>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-base-content/50">No users found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchUser;
