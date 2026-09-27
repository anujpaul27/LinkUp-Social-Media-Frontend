import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router";
import { UserContext } from "../Context/ContextProvider";

function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigate();
  const { login } = useContext(UserContext);

  function handleSubmit(event) {
    event.preventDefault();
    setError("")
    const form = event.target;
    const formValue = new FormData(form);
    const Obj = Object.fromEntries(formValue.entries());
    setLoading(true);

    login(Obj.email, Obj.password)
      .then((res) => {
        navigation("/");
      })
      .catch((error) => {
        console.error(error.message);
        setError("Invalid User!. Please enter valid email and password.");
        setLoading(false);
      });
  }

  return (
    <section className="py-16 bg-base-200">
      <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl">
        <h2 className="flex justify-center items-center gap-3 text-3xl font-bold text-center mb-8 text-pink-400">
          <img className="w-10" src="/LinkUpLogo.png" alt="logo" />
          LinkUp
        </h2>
        <h2 className="text-3xl font-bold text-center mb-8 text-white bg-gray-700 rounded-full py-2">
          Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="form-control">
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className="input input-bordered rounded-full w-full"
              required
            />
          </div>

          {/* Password Field */}
          <div className="form-control">
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              className="input input-bordered rounded-full w-full"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-red-500 text-sm flex justify-center ">{error}</p>
          )}

          <p className="text-gray-300 text-sm">
            Default login email: admin@linkup.com<br />
            password: Admin#@12
          </p>

          {/* Forget password */}
          <div className="flex justify-between items-center">
            <button className="btn btn-link text-white ">Forget Password</button>
            <Link className="btn btn-link text-white " to={"/registration"}>
              Registration
            </Link>
          </div>

          {/* Buttons */}
          <div className="flex w-full gap-4 pt-4">
            <button
              type="submit"
              className={`btn ${!loading && 'btn-primary'} flex-1 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all `}
            >
              {loading ? "Logging in..." : "Login"}
              {loading && 
                <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://w3.org"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              }
            </button>
            <button
              type="reset"
              className="btn btn-outline btn-secondary flex-1 rounded-full"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default Login;