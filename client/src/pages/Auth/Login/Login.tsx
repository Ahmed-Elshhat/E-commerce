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
const Login = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md shadow-lg rounded-lg overflow-hidden bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-semibold mb-6 text-center">Sign In</h2>
        <div className="flex justify-center space-x-4 mb-4">
          <button className="w-10 h-10 bg-gray-200 rounded-full"></button>
          <button className="w-10 h-10 bg-gray-200 rounded-full"></button>
        </div>
        <div className="mb-4">
          <label className="block text-gray-600 mb-2">Username</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
            placeholder="Username"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-600 mb-2">Password</label>
          <input
            type="password"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
            placeholder="Password"
          />
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 text-sm">
          <label className="flex items-center mb-2 sm:mb-0">
            <input type="checkbox" className="mr-2" /> Remember Me
          </label>
          <a href="#" className="text-blue-500">Forgot Password?</a>
        </div>
        <button className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 text-sm sm:text-base">
          Sign In
        </button>
        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account? <a href="#" className="text-blue-500">Create one</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
