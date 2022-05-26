import { LoadingContextProvider } from "../../context";

const BarraLoading = () => {
  const { loading } = LoadingContextProvider();
  return (
    <>
      <div className={`h-2 w-full bg-base fixed bottom-0`}>
        <div
          id="barLoading"
          className={`absolute h-2 w-1/2 transition transform -translate-x-full ${
            loading
              ? " duration-1000 bg-gradient-to-r from-primary to-base"
              : ""
          }`}
        />
      </div>

      <style jsx>
        {`
          #barLoading {
            ${loading ? "--tw-translate-x: 200%;" : ""}
          }
        `}
      </style>
    </>
  );
};

export default BarraLoading;
