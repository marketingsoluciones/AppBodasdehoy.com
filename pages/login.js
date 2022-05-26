import FormLogin from "../components/Forms/FormLogin";

const Login = () => {
  return (
    <>
      <div className="h-screen w-screen float-right text-gray-500 font-display">
        <div className="mx-auto w-1/2 mt-40">
          <div className="pb-6 w-1/2 mx-auto">
            <h2 className="w-full text-2xl font-bold font-display py-2 text-center">LOGIN</h2>
            <p className="text-sm  text-center">
              Aplicación para organizar tu boda de ensueño
            </p>
            <FormLogin />
          </div>
        </div>
      </div>
    </>
  );
}

export default Login