
export const useImportGuest = () => {

  const contactsForApiGoogle = async () => {
    const API_KEY = 'AIzaSyBOJRBiu2MEvKqgvPq-fqNINs9ep6r2p0A';
    const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/people/v1/rest';
    const CLIENT_ID = '1087923505585-1plf4sd0elbvt1t1rmrdug7e5u163s72.apps.googleusercontent.com';
    const SCOPES = 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/contacts.readonly';

    window.gapi.load('client', async () => {
      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
      })
    })
    const resp = window?.gapi?.client?.getToken()
    let access_token = resp?.access_token

    const clientAccount = await window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // defined later
    });

    const tokenResponse = async () => {
      return await new Promise((resolve, reject) => {
        try {
          clientAccount.callback = (resp) => {
            if (resp.error !== undefined) {
              reject(resp);
            }
            resolve(resp);
          };
          clientAccount.requestAccessToken({ prompt: "" }); //consent
        } catch (error) {
          console.log(1000001, "error", error);
        }
      });
    }

    if (!access_token) {
      try {
        const tokenGapi = await tokenResponse()
        access_token = tokenGapi?.access_token
      } catch (error) {
        console.log(1000002, "error", error);
      }
    }

    let contacts = []
    let totalItems = 0
    let result
    if (access_token) {
      try {
        const response = await window?.gapi?.client?.people?.people?.connections?.list({
          'resourceName': 'people/me',
          'pageSize': 300,
          'personFields': 'names,emailAddresses,phoneNumbers',
          'sortOrder': 'FIRST_NAME_ASCENDING'
        });
        result = response?.result
      } catch (error) {
        console.log(1000003, "error", error);
        const tokenGapi = await tokenResponse()
        access_token = tokenGapi?.access_token
        const response = await window?.gapi?.client?.people?.people?.connections?.list({
          'resourceName': 'people/me',
          'pageSize': 1000,
          'personFields': 'names,emailAddresses,phoneNumbers',
          'sortOrder': 'FIRST_NAME_ASCENDING'
        });
        result = response?.result
      }
    }

    const asd = {
      state: !!access_token,
      payload: {
        access_token,
        result
      }
    }
    return asd;
  }
  return [contactsForApiGoogle]

}

