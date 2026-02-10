const Footer = () => {
  return (
    <div className="main w-screen bg-black py-4 text-white text-[8px] sm:text-xl text-center font-extrabold flex justify-between items-center md:px-10 px-2 fixed bottom-0">
      <h1>All Right reserved bt BWT.</h1>
      <p className="text-[] sm:text-sm ">
        {" "}
        By. <span className="text-green-800">Abdullah Saafi </span> Under
        Supervison of{" "}
        <span className=" font-extrabold underline text-green-800">
          {" "}
          Sir Usman
        </span>
      </p>
    </div>
  );
};

export default Footer;
