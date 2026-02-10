import LoginComp from "../componenets/LoginComp";

const Home = () => {
  return (
    <div className="main md:mt-20 flex  justify-center gap-6 p-6 sm:p-6 ">
      <div className=" w-150 shadow-lg shadow-black-500 hidden md:flex justify-center items-center ">
        <img src="/imgs/Logo.jpg" alt="" className="h-150" />
      </div>
      <div className="min-h-150 py-6 w-150 flex items-center shadow-lg shadow-black-500 p-10">
        <LoginComp />
      </div>
    </div>
  );
};

export default Home;
