import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const GoogleLoginButton = () => {
  const navigate = useNavigate();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const accessToken = tokenResponse.access_token;
        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v1/userinfo",
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        // PERBAIKAN 1: Gunakan endpoint yang benar sesuai backend
        const userResponse = await axios.post(
          "http://localhost:5000/api/users/get-or-create", // Tambahkan /api dan perbaiki path
          { email: userInfo.data.email },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        // PERBAIKAN 2: Validasi response
        if (!userResponse.data?.user?.id) {
          throw new Error('Invalid user response from server');
        }

        const { id: userId, email } = userResponse.data.user;

        // Simpan informasi user
        localStorage.setItem("user_id", userId);
        localStorage.setItem("email", email);
        localStorage.setItem("token", accessToken);

        navigate("/dashboard");
      } catch (error) {
        console.error("Error:", error);
        // PERBAIKAN 3: Handle error lebih baik
        if (error.response) {
          console.error("Server response:", error.response.data);
          alert(`Error: ${error.response.data.message || 'Server error'}`);
        } else {
          alert('Login gagal, silahkan coba lagi');
        }
      }
    },
    onError: (error) => {
      console.log("Login Failed:", error);
      alert('Login dengan Google gagal');
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
