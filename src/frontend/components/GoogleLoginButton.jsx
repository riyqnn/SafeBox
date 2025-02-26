import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const GoogleLoginButton = () => {
  const navigate = useNavigate();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        console.log("Login successful!");

        // Ambil access_token dari response
        const accessToken = tokenResponse.access_token;

        // Ambil data user dari Google API
        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v1/userinfo",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        // Simpan email dan token di localStorage
        localStorage.setItem("email", userInfo.data.email);
        localStorage.setItem("token", accessToken);

        // Hanya log informasi non-sensitif jika perlu (untuk pengembangan)
        if (process.env.NODE_ENV === 'development') {
          console.log("User logged in successfully.");
        }

        // Redirect ke dashboard
        console.log("Redirecting to dashboard...");
        navigate("/dashboard");
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    },
    onError: () => {
      console.log("Login Failed");
    },
  });

  return (
    <button
      className="w-full flex items-center justify-center px-3 py-2 text-sm border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      onClick={() => login()}
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png"
        alt="Google Logo"
        className="w-4 h-4 mr-2"
      />
      <span className="text-gray-700">Continue with Google</span>
    </button>
  );
};

export default GoogleLoginButton;
