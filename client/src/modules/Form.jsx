import React, { useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
const apiUrl = process.env.REACT_APP_API_URL;

function Form({ isSignInPage = true }) {
  const [data, setData] = useState({
    ...(isSignInPage && {
      fullName: "",
    }),
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Data =>", data);
      const res = await axios.post(`${apiUrl}/api/${isSignInPage ? "login" : "register"}`, data, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("Data :>>", res.data);
      if (res.data.token) {
        localStorage.setItem("user:token", res.data.token);
        localStorage.setItem("user:details", JSON.stringify(res.data.user));
        navigate("/");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        alert("Invalid Credentials"); // ✅ Handle incorrect login with 401 status
      } else {
        console.error("Error =>", error.response?.data || error.message);
        alert(error.response?.data?.message || "An error occurred");
      }
    }
  };


  return (
    <div className="bg-blue-100 h-screen flex justify-center items-center">
      <div className="bg-white w-[450px] h-[600px] shadow-lg rounded-lg flex flex-col justify-center items-center">
        <div className="text-4xl font-extrabold ">{isSignInPage ? "Welcome Back" : "Welcome"}</div>
        <div className="text-xl font-light mb-14">
          {isSignInPage ? "Sign in to get explored" : "Sign up now to get started"}
        </div>
        <form className="flex flex-col w-full items-center" onSubmit={(e) => handleSubmit(e)}>
          {isSignInPage ? (
            ""
          ) : (
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
            placeholder="Enter your email "
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
            label={isSignInPage ? "Sign in" : "Sign Up"}
            className="w-[70%] mb-2"
            type="submit"
          />
        </form>

        <div>
          {isSignInPage ? "Didn't have an acoount ? " : "Aready have an account ? "}

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
