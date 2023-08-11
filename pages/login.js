import { router, useRouter } from "next/router";
import { ButtonClose } from "../components/Forms/ButtonClose";
import { Login, Register, ResetPass } from "../components/Forms/Login/Forms";
import { useState } from "react";



const PageLogin = () => {
  const { query } = useRouter()
  console.log(10001, query)
  const [stage, setStage] = useState("login");
  const [fStageRegister, setFStageRegister] = useState(0)


  const Stages = {
    login: <Login setStage={setStage} />,
    register: <Register fStageRegister={fStageRegister} setStage={setStage} />,
    resetPassword: <ResetPass setStage={setStage} />
  };


  return (
    <>
      <div className="w-screen fixed h-full top-0 left-0 md:grid z-30 grid-cols-5 ">
        <div className="bg-white w-full h-full col-span-3 relative flex items-center justify-center  ">
          <ButtonClose onClick={() => {
            setTimeout(() => {
              router.push(!query?.d ? "/" : query?.d)
            }, 100);
          }} />
          <div className="flex flex-col items-center gap-4 w-full px-10 md:px-0 sm:w-3/4 md:w-2/3  ">
            {Stages[stage]}
          </div>
        </div>
        <div className="hidden md:block banner w-full h-full col-span-2 " />
      </div>
      <style jsx>
        {`
          .banner {
            background-image: url("/banner-login.webp");
            background-size: cover;
            background-position: top;
          }
        `}
      </style>
    </>
  );
}

export default PageLogin