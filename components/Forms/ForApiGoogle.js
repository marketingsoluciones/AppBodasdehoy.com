import { useEffect, useState } from "react"
import { MdOutlineSearch, MdOutlineCheck } from "react-icons/md"
import { ArrowLeft } from "../icons"

export const ForApiPeople = ({ setContact, showForApiGoogle, setShowForApiGoogle, }) => {
  const [userInfo, setUserInfo] = useState()
  const [contacts, setContacts] = useState(
    showForApiGoogle?.payload?.result?.connections?.reduce((acc, item) => {
      const phones = `${item?.phoneNumbers?.map(elem => elem?.canonicalForm)}`
      acc.push({ ...item, textSearch: `${item?.names[0]?.displayName} ${``} ${phones.replace(/,/g, " ")}` })
      return acc
    }, [])
  )
  const [searchContacts, setSearchContacts] = useState()
  const [contactsShow, setContactsShow] = useState()
  const [itemSelect, setItemSelect] = useState()
  const [activeSearch, setActiveSearch] = useState(false)

  let nextPageToken = showForApiGoogle?.payload?.result?.nextPageToken
  delete showForApiGoogle?.payload?.result?.nextPageToken

  const getData = (nextPageToken) => {
    window.gapi.client.people.people.connections.list({
      'resourceName': 'people/me',
      'pageSize': 300,
      'personFields': 'names,emailAddresses,phoneNumbers',
      'sortOrder': 'FIRST_NAME_ASCENDING',
      'pageToken': nextPageToken
    }).then(response => {
      const search = response?.result?.connections?.reduce((acc, item) => {
        const phones = `${item?.phoneNumbers?.map(elem => elem?.canonicalForm)}`
        acc.push({ ...item, textSearch: `${item?.names[0]?.displayName} ${``} ${phones.replace(/,/g, " ")}` })
        return acc
      }, [])
      const newContacts = [...contacts, ...search]
      setContacts(newContacts)
      nextPageToken = response?.result?.nextPageToken
      if (nextPageToken) {
        getData(nextPageToken)
      }
    })
  }

  useEffect(() => {
    if (nextPageToken) {
      getData(nextPageToken)
    }
  }, [])

  useEffect(() => {
    const requestOptions = {
      method: 'GET',
      redirect: 'follow'
    }
    fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=\"${showForApiGoogle?.payload?.access_token}\"`, requestOptions)
      .then(response => response.text())
      .then(result => setUserInfo(JSON.parse(result)))
      .catch(error => console.log('error', error))
  }, [])

  useEffect(() => {
    setContactsShow(searchContacts ? searchContacts : contacts)
  }, [contacts, searchContacts])

  const handleOnChange = (e) => {
    let search
    if (e.target.value.length > 0) {
      const search = contacts.filter((elem) => elem.textSearch.toLowerCase().includes(e.target.value.toLowerCase()))
      setSearchContacts(search)
      return
    }
    search = contacts
    setSearchContacts(search)
  }

  const handleArrowLeft = () => {
    if (activeSearch) {
      setActiveSearch(false)
      setSearchContacts(contacts)
      return
    }
    setShowForApiGoogle({ state: false })
  }

  const handleOnClickListo = () => {
    const contact = contactsShow.find(ele => ele?.etag === itemSelect)
    setContact({
      name: contact['names'] && contact?.names[0]?.displayName,
      email: contact['emailAddresses'] && contact?.emailAddresses[0]?.value,
      phones: contact['phoneNumbers'] && contact?.phoneNumbers?.map(ele => ele?.canonicalForm)
    })
    setShowForApiGoogle({ state: false })
  }

  return (
    <div className="fixed z-10 top-0 left-0 w-[100vw] h-[100vh]  flex items-center justify-center font-display text-md">
      <div className="bg-gray-900 opacity-50 absolute z-10 top-0 left-0 w-full h-full flex items-center justify-center" />
      <div className="bg-white w-full md:w-[500px] 2xl:w-[600px] h-full md:h-[80%] md:rounded-3xl opacity-100 z-20 truncate">
        <div className="w-full h-[50px] p-2 shadow-lg">
          <div className={`w-full h-full flex items-center ${!activeSearch ? "justify-between" : "bg-gray-200 justify-start rounded-full"} px-0 truncate`} >
            <ArrowLeft className="w-[50px] h-6 text-gray-700 cursor-pointer" onClick={handleArrowLeft} />
            <div className={`flex items-center ${!activeSearch ? "w-[calc(100%-100px)] md:w-[400px] 2xl:w-[500px]" : "w-[calc(100%-50px)] md:w-[450px] 2xl:w-[550px]"}`}>
              {activeSearch
                ? <input autoFocus onChange={(e) => { handleOnChange(e) }} type="text" className="bg-transparent flex w-[calc(100%-20px)] h-6 border-0 focus:outline-none focus:border-none focus:ring-0 text-sm" placeholder="Busca entre tus contactos" />
                : <>
                  <span className="text-[16px] w-[calc(100%-50px)] truncate ml-2">{itemSelect ? "1 Contacto seleccionado" : "Seleccionar un Contacto"}</span>
                  <MdOutlineSearch className="w-[50px] h-6 cursor-pointer" onClick={() => { setActiveSearch(!activeSearch) }} />
                </>
              }
            </div>
            {!activeSearch && <div className="w-[50px] flex justify-center">
              <button disabled={!itemSelect} type="button" className={`flex justify-center items-center w-10 h-6 text-sm ${itemSelect ? "text-gray-900" : "text-gray-400"}`}
                onClick={handleOnClickListo}>Listo</button >
            </div>
            }
            {false && <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center truncate">
              <img src={userInfo?.picture} />
            </div>}
          </div>
        </div>
        <div className="w-full h-[calc(100%-100px)] overflow-auto flex flex-col mt-2">
          <div className="flex flex-col ml-4 text-sm">
            <p>{contactsShow ? "Los contactos que selecciones se compartiran con" : "No tiene contactos en su cuenta de correo"}</p>
            <p className="font-semibold translate-y-[-4px]">{contactsShow ? window.location.hostname : userInfo?.email}</p>
          </div>
          {contactsShow?.map((elem, idx) => {
            return (
              <div key={idx} onClick={() => {
                setActiveSearch(false)
                setItemSelect(itemSelect === elem?.etag ? null : elem?.etag)
                setSearchContacts(contacts)
              }}
                className={"flex items-center gap-4 ml-4 pt-3 pb-3 cursor-pointer"} >
                <div className={`${itemSelect === elem?.etag ? "bg-blue-700" : "bg-gray-600"} w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center truncate text-white`}>
                  <span className="translate-x-[1px] text-sm">
                    {itemSelect === elem?.etag ? <MdOutlineCheck className="w-6 h-6" /> : elem?.names[0]?.displayName.slice(0, 1)}
                  </span>
                </div>
                <div className="flex flex-col text-xs md:text-sm">
                  <span  >{elem?.names[0]?.displayName}</span>
                  <div className="" >
                    {elem?.phoneNumbers?.map((el, i) => <span className="ml-2" key={i}>{el.canonicalForm}</span>)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}