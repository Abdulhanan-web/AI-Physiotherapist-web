// pages/GoogleFitConnect.jsx
import { useGoogleLogin } from "@react-oauth/google";

const GoogleFitConnect = () => {

  const connectGoogleFit = useGoogleLogin({
    scope:
      "https://www.googleapis.com/auth/fitness.activity.read " +
      "https://www.googleapis.com/auth/fitness.body.read " +
      "https://www.googleapis.com/auth/fitness.heart_rate.read " +
      "openid profile email",

    prompt: "consent",

    onSuccess: async (tokenResponse) => {
      const res = await fetch("http://localhost:8000/google-fit/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          access_token: tokenResponse.access_token
        })
      });

      const data = await res.json();
      console.log(data);
    },

    onError: () => {
      console.log("Google Fit connection failed");
    }
  });

  return (
    <button onClick={() => connectGoogleFit()}>
      Connect Google Fit
    </button>
  );
};

export default GoogleFitConnect;