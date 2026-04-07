import { useDispatch, useSelector } from "react-redux";
import { useNavigate, NavLink } from "react-router-dom";
import { logout } from "../../redux/slices/authSlice";

const AdminHeader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const activeClass =
    "text-indigo-600 border-b-2 border-indigo-600 pb-1 font-medium";
  const normalClass = "hover:text-indigo-600";

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <div className="flex items-center gap-8">
          <h1 className="text-lg font-bold text-indigo-600">
            EIMS Admin
          </h1>

          <nav className="flex gap-6 text-sm text-gray-600">
            <NavLink to="/admin" className={({ isActive }) => isActive ? activeClass : normalClass}>
              Dashboard
            </NavLink>

            <NavLink to="/admin/academic-years" className={({ isActive }) => isActive ? activeClass : normalClass}>
              Academic Years
            </NavLink>

            <NavLink to="/admin/users" className={({ isActive }) => isActive ? activeClass : normalClass}>
              Users
            </NavLink>

            <NavLink to="/admin/departments" className={({ isActive }) => isActive ? activeClass : normalClass}>
              Departments
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <span className="text-gray-500">
            {user?.fullName || "Admin"}
          </span>

          <button
            onClick={handleLogout}
            className="px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;