import { getAuth } from "firebase/auth";
import { AuthContextProvider } from "../context";
import { fetchApiEventos, queries } from "../utils/Fetching";


export const useActivity = () => {
  const { link_id, storage_id, user } = AuthContextProvider()

  enum activities {
    used,
    accessed,
    registered,
    logged,
    logoutd
  }

  const updateActivity = async(activity: keyof typeof activities) => {
    try {
      await fetchApiEventos({
        query: queries.updateActivity,
        variables: { args: { activity}}
      })
    } catch (error) {
      console.log(error)
    }
  };
  
  const updateActivityLink = async (activity: keyof typeof activities) => {
    try {
      if (link_id) {
        await fetchApiEventos({
          query: queries.updateActivityLink,
          variables: { args: { link_id ,storage_id, activity}}
        })
      }
    } catch (error) {
      console.log(error)
    }
  };
  return [updateActivity, updateActivityLink]
};
