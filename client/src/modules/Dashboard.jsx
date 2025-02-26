import React from "react";
import userLogo from "../assets/user-solid.svg";
import Input from "../components/Input";


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
        <div className="w-[75%] bg-gray-100 h-[80px] mt-4 mb-6 rounded-full flex items-center px-14 ">
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
        <div className="h-[75%]  w-full overflow-auto scrollbar-hide shadow-sm">
          <div className="p-12 ">
            <div className=" max-w-[40%] bg-gray-100 rounded-b-xl rounded-tr-xl p-4 mb-4">
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
            </div>
            <div className="max-w-[40%] bg-blue-400 rounded-b-xl rounded-tl-xl ml-auto p-4 text-white mb-4 ">
              Lorem ipsum dolor. Voluptas, iusto doloribus.
            </div>
            <div className=" max-w-[40%] bg-gray-100 rounded-b-xl rounded-tr-xl p-4 mb-4">
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
            </div>
            <div className="max-w-[40%] bg-blue-400 rounded-b-xl rounded-tl-xl ml-auto p-4 text-white mb-4 ">
              Lorem ipsum dolor. Voluptas, iusto doloribus.{" "}
            </div>
            <div className=" max-w-[40%] bg-gray-100 rounded-b-xl rounded-tr-xl p-4 mb-4">
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
            </div>
            <div className="max-w-[40%] bg-blue-400 rounded-b-xl rounded-tl-xl ml-auto p-4 text-white mb-4 ">
              Lorem ipsum dolor. Voluptas, iusto doloribus.{" "}
            </div>
            <div className=" max-w-[40%] bg-gray-100 rounded-b-xl rounded-tr-xl p-4 mb-4">
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
            </div>
            <div className="max-w-[40%] bg-blue-400 rounded-b-xl rounded-tl-xl ml-auto p-4 text-white mb-4 ">
              Lorem ipsum dolor. Voluptas, iusto doloribus.{" "}
            </div>
          </div>
        </div>
        <div className="p-8 w-full flex items-center">
          <div className="mr-4 p-2 cursor-pointer bg-light rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              width="30"
              height="30"
              stroke-width="2"
            >
              <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path>
              <path d="M9 12h6"></path>
              <path d="M12 9v6"></path>
            </svg>
          </div>
          <Input
            placeholder="Type a message..."
            className="w-[75%]"
            inputClassName="p-4 border border-gray-300 shadow-md !rounded-full bg-light focus:ring-0 focus:border-blue-400 outline-none"
          />
          <div className="ml-4 p-2 cursor-pointer bg-light rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              width="30"
              height="30"
              stroke-width="2"
            >
              <path d="M10 14l11 -11"></path>
              <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5"></path>
            </svg>
          </div>
        </div>
      </div>
      <div className="min-h-screen w-full md:w-1/4 bg-gray-100"></div>
    </div>
  );
};

export default Dashboard;
