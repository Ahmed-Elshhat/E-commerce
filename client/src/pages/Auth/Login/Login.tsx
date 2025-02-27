// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { FaUser, FaLock, FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
// import axios from "axios";
// import { BASE_URL, LOGIN } from "../../../Api/Api";
// import Cookie from "cookie-universal";

// function Login() {
//   const [form, setForm] = useState({
//     email: "",
//     password: "",
//   });
//   const [showPassword, setShowPassword] = useState<boolean>(false);
//   const navigate = useNavigate();
//   const cookies = Cookie();

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const togglePasswordVisibility = () => {
//     setShowPassword(!showPassword);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       const res = await axios.post(`${BASE_URL}${LOGIN}`, form);
//       if (res.status === 200) {
//         const token = res.data.token;
//         cookies.set("ECT", token);
//         navigate("/", { replace: true });
//       }
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col justify-center bg-white">
//       <div className="w-full max-w-md mx-auto h-full flex flex-col justify-center px-8 py-20 bg-white sm:bg-gray-100 sm:rounded-2xl sm:shadow-lg">
//         <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
//           Welcome Back 👋
//         </h2>

//         <form onSubmit={handleSubmit} className="flex flex-col gap-y-10">
//           {/* Email Input */}
//           <div className="relative">
//             <FaUser className="absolute left-3 top-4 text-gray-500" />
//             <input
//               type="email"
//               placeholder="Email"
//               name="email"
//               value={form.email}
//               onChange={handleChange}
//               required
//               className="w-full px-10 py-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
//             />
//           </div>

//           {/* Password Input */}
//           <div className="relative">
//             <FaLock className="absolute left-3 top-4 text-gray-500" />
//             <input
//               type={showPassword ? "text" : "password"}
//               placeholder="Password"
//               name="password"
//               value={form.password}
//               onChange={handleChange}
//               required
//               className="w-full px-10 py-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg pr-12"
//             />
//             <button
//               type="button"
//               onClick={togglePasswordVisibility}
//               className="absolute right-3 top-4 text-gray-500 focus:outline-none cursor-pointer text-xl"
//             >
//               {showPassword ? <FaEyeSlash /> : <FaEye />}
//             </button>
//           </div>

//           {/* Forgot Password */}
//           <div className="text-center">
//             <Link to="/forgot-password" className="text-blue-500 hover:underline text-lg">
//               Forgot Password?
//             </Link>
//           </div>

//           {/* Submit Button */}
//           <button
//             type="submit"
//             className="w-full py-4 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition cursor-pointer text-lg"
//           >
//             Login
//           </button>
//         </form>

//         {/* OR Divider */}
//         <div className="relative text-center my-10">
//           <span className="absolute inset-x-0 top-1/2 bg-white px-2 text-lg text-gray-500">
//             OR
//           </span>
//           <div className="h-px bg-gray-300"></div>
//         </div>

//         {/* Google Login Button */}
//         <a
//           href="http://localhost:8000/api/v1/auth/google"
//           className="no-underline"
//         >
//           <button className="w-full flex items-center justify-center gap-3 py-4 text-gray-700 bg-white border rounded-lg shadow-sm hover:bg-gray-100 transition cursor-pointer text-lg">
//             <FaGoogle className="text-red-500" />
//             <span>Continue with Google</span>
//           </button>
//         </a>

//         {/* Signup Link */}
//         <p className="text-lg text-center text-gray-600 mt-10">
//           Don't have an account?{" "}
//           <Link to="/signup" className="text-blue-500 hover:underline">
//             Sign up
//           </Link>
//         </p>
//       </div>
//     </div>
//   );

// }

// export default Login;

import { useState } from "react";
import "./Login.scss";
import { Link, useNavigate } from "react-router-dom";
import Cookie from "cookie-universal";
import axios from "axios";
import { BASE_URL, LOGIN } from "../../../Api/Api";
import { LoginFormState } from "../../../Types/app";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";

function Login() {
  const [form, setForm] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigate = useNavigate();
  const cookies = Cookie();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BASE_URL}${LOGIN}`, form);
      if (res.status === 200) {
        const token = res.data.token;
        cookies.set("ECT", token);
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="login">
      <div className="login-box">
        <h2>Sign in</h2>
        <form onSubmit={handleSubmit}>
          <div className="email">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              required
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="password">
            <label htmlFor="password">Password</label>
            <div className="password-cover">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                required
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-4 text-gray-500 focus:outline-none cursor-pointer text-xl"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="remember-me-and-forgot-pass">
            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>

            <div className="forgot-pass">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>
          </div>

          <button className="signin-btn">Sign in</button>

          <div className="or-divider">
            <div className="line"></div>
            <span>Or</span>
          </div>

          <a href="http://localhost:8000/api/v1/auth/google" className="signin-google-btn">
            <FaGoogle /> Sign in with Google
          </a>

          <div className="signup">
            <p>Don't have an account?</p>
            <Link to="/signup">Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
