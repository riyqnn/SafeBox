import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import GoogleLoginButton from "../components/GoogleLoginButton";
import Logo from "/logo.png";
import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="flex flex-col md:flex-row w-full h-screen bg-gray-100">
      {/* Left Section */}
      <div className="hidden md:flex w-full h-screen flex-1 bg-cover bg-center bg-no-repeat text-white p-10 flex-col justify-between relative" 
           style={{ backgroundImage: "url('/bakgorund.webp')" }}>
        <div className="absolute top-5 left-7 flex items-center space-x-3">
          <img src={Logo} alt="SafeBoX" className="w-10" />
          <h2 className="text-2xl font-bold">SafeBox</h2>
        </div>

        <div className="flex flex-col items-start justify-center text-left h-full mt-7  ">
          <h1 className="text-5xl font-bold mb-4 hidden sm:block self-start ml-35">
            Safe. Private. <br /> Decentralized.
          </h1>
          <p className="text-lg hidden sm:block ml-35">Manage your files the best way</p>
        </div>

        <div className="flex space-x-4 ml-0 relative top-2">
          <a href="#" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <QuestionMarkCircleIcon className="w-5 h-5" />
            <span className="font-medium text-sm">Support</span>
          </a>
          <a href="https://github.com/riyqnn" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-sm">Source code</span>
          </a>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex flex-col items-center justify-center w-full sm:w-1/2 h-screen p-8 bg-white">
        <div className="text-center mb-6 max-w-md sm:w-96">
          <h2 className="text-2xl font-bold text-gray-800">Welcome Back!</h2>
          <p className="text-sm text-gray-500">We're so excited to see you again</p>
        </div>
        
        <form className="w-full max-w-sm space-y-4">

        <div className="relative">
            <input
              type="fname"
              placeholder=" "
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg peer focus:outline-none focus:border-[#5a9eff]"
            />
            <label className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:text-[#7953f3] left-1">
              Full Name
            </label>
          </div>

          <div className="relative">
            <input
              type="email"
              placeholder=" "
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg peer focus:outline-none focus:border-[#5a9eff]"
            />
            <label className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:text-[#7953f3] left-1">
              Email
            </label>
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder=" "
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg peer focus:outline-none focus:border-[#5a9eff]"
            />
            <label className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:text-[#7953f3] left-1">
              Password
            </label>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center space-x-1.5">
              <input type="checkbox" className="rounded border-blue-500" />
              <span className="text-gray-600">Remember me</span>
            </label>
            <a href="#" className="font-medium text-[#5a9eff] hover:text-[#7953f3]">Forgot password?</a>
          </div>

          <button className="w-full py-2 bg-[#5a9eff] text-white text-sm font-semibold rounded-lg hover:bg-[#7953f3] transition-colors">
            Sign Up
          </button>
        </form>

        <div className="w-full max-w-sm my-4 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-xs text-gray-500">Or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Google Login Button */}
        <div className="w-full max-w-sm">
          <GoogleLoginButton />
        </div>

        <p className="text-xs text-gray-600 mt-4">
          Already have an account?  
          <Link to="/sign-In" className="text-[#5a9eff] font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default Register; 