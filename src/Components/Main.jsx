import { motion } from "framer-motion";
import Sidebar from "./LeftSidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router";
import { useState } from "react";
import { Toaster } from "react-hot-toast";

function Main() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div
      data-theme={darkMode ? "dark" : "light"}
      className="min-h-screen bg-base-200"
    >
      <div className="drawer lg:drawer-open">
        <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          {/* Top Navbar */}
          <Navbar></Navbar>

          {/* Main Content */}
          <Outlet></Outlet>
        </div>

        {/* Sidebar */}
        <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
        <Toaster position="top-center" reverseOrder={false} />
      </div>
    </div>
  );
}

export default Main;
