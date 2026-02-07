import { useRouter } from "next/navigation"
import Loading from "../components/DefaultLayout/Loading"
import { AuthContextProvider } from "../context"
import { getCookie } from "../utils/Cookies"
import { getAuth } from "firebase/auth";

const PagesWithAuth = (WrappedComponent, authorizationByRole) => {
  return (props) => {
    // checks whether we are on client / browser or server.
    if (typeof window !== "undefined") {
      const router = useRouter();
      const user = null
      const token = getCookie('token-bodas')

      getAuth().onAuthStateChanged(user => {
        console.log(user)
        if (!user) {
          router.replace("/")
          return <Loading />;
        }

        return <WrappedComponent {...props} />
      })
      // if (!token) {
      //   router.replace("/")
      //   return <Loading />;
      // }

      // if(authorizationByRole){
      //   if(user?.role?.includes(authorizationByRole)){
      //     return <WrappedComponent {...props} />;
      //   } else {
      //     router.replace("/")
      //     return <Loading />;
      //   }
      // }

      // return <WrappedComponent {...props} />;
    }

    // If we are on server, return null
    return null;
  };
};

export default PagesWithAuth;
