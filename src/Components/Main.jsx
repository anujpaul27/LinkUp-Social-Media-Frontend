import Sidebar from "./LeftSidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router";
import { Toaster } from "react-hot-toast";

function Main() {
  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <div className="drawer lg:drawer-open">
        <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          {/* Top Navbar */}
          <Navbar></Navbar>

          {/* Main Content */}
          <div className="pb-16 lg:pb-0">
            <Outlet></Outlet>
          </div>
        </div>

        {/* Sidebar */}
        <Sidebar />
        <Toaster position="top-center" reverseOrder={false} />
      </div>
    </div>
  );
}

export default Main;
