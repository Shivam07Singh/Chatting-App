import React from "react";
import userLogo from "../assets/user-solid.svg";

const Dashboard = () => {
  const contacts = [
    {
      name: "John",
      status: "Available",
      img: userLogo,
    },
    {
      name: "Marry",
      status: "Available",
      img: userLogo,
    },
    {
      name: "Adam",
      status: "Available",
      img: userLogo,
    },
    {
      name: "Larry",
      status: "Available",
      img: userLogo,
    },
    {
      name: "Alexander",
      status: "Available",
      img: userLogo,
    },
    
    {
      name: "Alexander",
      status: "Available",
      img: userLogo,
    },
    
  ];

  return (
    <div className="w-screen flex">
      <div className="h-screen w-[25%] bg-gray-100">
        <div className="flex items-center my-[20px] mx-14">
          <div className="border-2 border-blue-400 p-[4px] rounded-full overflow-auto">
            <img src={userLogo} width={50} height={50} alt="userLogo" />
          </div>
          <div className="ml-8">
            <p className="text-2xl">Tutorial</p>
            <p className="text-lg font-light">My Account</p>
          </div>
        </div>
        <hr />
        <div className="mx-14 mt-7">
          <div className="text-blue-400 text-lg">Messages</div>
          <div>
            {contacts.map(({ name, status, img }) => {
              return (
                <div className="flex items-center py-[20px] border-b border-b-gray-300">
                  <div className="cursor-pointer flex items-center">
                    <div className="border border-black p-[4px] rounded-full overflow-auto">
                      <img src={img} width={35} height={35} alt="userLogo" />
                    </div>
                    <div className="ml-6">
                      <h3 className="text-lg font-semibold">{name}</h3>
                      <p className="text-sm text-gray-400 font-light">{status}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="h-screen w-[50%] bg-white flex flex-col items-center">
        <div className="w-[75%] bg-gray-100 h-[80px] mt-14 rounded-full flex items-center px-14">
          <div className=" cursor-pointer">
            <img src={userLogo} alt="userlogo" width={40} height={40} />
          </div>
          <div className="ml-6 mr-auto">
            <h3 className="text-lg ">Alexander</h3>
            <p className="text-sm text-gray-400 font-light">online</p>
          </div>
          <div className="cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              width="24"
              height="24"
              stroke-width="2"
            >
              <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path>
            </svg>
          </div>
        </div>
        <div className="h-[75%] border w-full overflow-scroll">
          <div className="h-[1000px] px-10 py-14">
            <div className="h-[80px] w-[300px] bg-gray-100 rounded-b-lg rounded-tr-lg"></div>
          </div>
        </div>
        
      </div>
      <div className="min-h-screen w-full md:w-1/4"></div>
    </div>
  );
};

export default Dashboard;
