import React, { useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Set default backend URL if environment variable is missing
const apiUrl = process.env.REACT_APP_API_URL || "https://chatting-app-ntgk.onrender.com";

function Form({ isSignInPage = true }) {
  const [data, setData] = useState({
    ...(!isSignInPage && {
      // Changed to be more clear
      fullName: "",
    }),
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isSignInPage ? "login" : "register";
      const url = `${apiUrl}/api/${endpoint}`;

      console.log("Sending request to:", url);

      const res = await axios.post(url, data, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.token) {
        localStorage.setItem("user:token", res.data.token);
        localStorage.setItem("user:details", JSON.stringify(res.data.user));
        navigate("/");
      }
    } catch (error) {
      console.error("API Error:", error);

      if (error.response) {
        if (error.response.status === 401) {
          alert("Invalid email or password");
        } else if (error.response.status === 404) {
          alert("Service unavailable. Please try again later.");
        } else {
          alert(error.response.data.message || "Something went wrong");
        }
      } else {
        alert("Network error. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-blue-100 h-screen flex justify-center items-center">
      <div className="bg-white w-[450px] h-[600px] shadow-lg rounded-lg flex flex-col justify-center items-center">
        <div className="text-4xl font-extrabold ">{isSignInPage ? "Welcome Back" : "Welcome"}</div>
        <div className="text-xl font-light mb-14">
          {isSignInPage ? "Sign in to get explored" : "Sign up now to get started"}
        </div>
        <form className="flex flex-col w-full items-center" onSubmit={handleSubmit}>
          {!isSignInPage && (
            <Input
              label="Full name"
              name="name"
              placeholder="Enter your full name"
              className="mb-6 w-[70%]"
              value={data.fullName}
              onChange={(e) => setData({ ...data, fullName: e.target.value })}
            />
          )}

          <Input
            label="Email address"
            name="email"
            type="email"
            placeholder="Enter your email"
            className="mb-6 w-[70%]"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password"
            className="mb-12 w-[70%]"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />
          <Button
            label={isLoading ? "Processing..." : isSignInPage ? "Sign in" : "Sign Up"}
            className="w-[70%] mb-2"
            type="submit"
            disabled={isLoading}
          />
        </form>

        <div>
          {isSignInPage ? "Don't have an account? " : "Already have an account? "}
          <span
            className="text-blue-700 underline cursor-pointer"
            onClick={() => navigate(`/users/${isSignInPage ? "sign_up" : "sign_in"}`)}
          >
            {isSignInPage ? "Sign up" : "Sign in"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Form;
