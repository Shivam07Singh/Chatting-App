import React, { useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import { Navigate, useNavigate } from "react-router-dom";


function Form({ isSignInPage = true }) {
  const [data, setData] = useState({
    ...(isSignInPage && {
      fullName: "",
    }),
    email: "",
    password: "",
  });

const navigate = useNavigate()

  return (
    <div className="bg-blue-100 h-screen flex justify-center items-center">
      <div className="bg-white w-[450px] h-[600px] shadow-lg rounded-lg flex flex-col justify-center items-center">
        <div className="text-4xl font-extrabold ">{isSignInPage ? "Welcome Back" : "Welcome"}</div>
        <div className="text-xl font-light mb-14">
          {isSignInPage ? "Sign in to get explored" : "Sign up now to get started"}
        </div>
        <form
          className="flex flex-col w-full items-center"
          onSubmit={() => console.log("Form Submitted")}
        >
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

          <span className="text-blue-700 underline cursor-pointer" onClick={() => navigate(`/users/${isSignInPage ? 'sign_up' : 'sign_in'}`)}>
            {isSignInPage ? "Sign up" : "Sign in"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Form;
