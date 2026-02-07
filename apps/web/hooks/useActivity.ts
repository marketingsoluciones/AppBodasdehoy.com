import { getAuth } from "firebase/auth";
import { AuthContextProvider } from "../context";
import { fetchApiEventos, queries } from "../utils/Fetching";


export const useActivity = () => {
  const { link_id, storage_id, user, preregister, SetPreregister } = AuthContextProvider()

  enum activities {
    used,
    accessed,
    preregistered,
    registered,
    logged,
    logoutd,
    sessionStep1Step2,
    selectRole,
    enterStep2,
    focusEmail,
    focusName,
    focusPhone,
    backStep1,
    clickFacebook,
    clickGoogle,
    clickRegister,
    writePassword
  }

  const updateActivity = async (activity: keyof typeof activities) => {
    try {
      await fetchApiEventos({
        query: queries.updateActivity,
        variables: { args: { activity } }
      })
    } catch (error) {
      console.log(error)
    }
  };

  const updateActivityLink = async (activity: keyof typeof activities) => {
    try {
      if (link_id) {
        fetchApiEventos({
          query: queries.updateActivityLink,
          variables: {
            args: {
              link_id,
              [preregister ? "_id" : "storage_id"]: preregister ? preregister?._id : storage_id,
              activity
            }
          }
        }).then(result => {
          if (activity === "registered") {
            SetPreregister(null)
          }
        })
      }
    } catch (error) {
      console.log(error)
    }
  };
  return [updateActivity, updateActivityLink]
};
