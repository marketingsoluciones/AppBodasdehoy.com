import Banner from "./Banner"

export const FooterComponent = () =>{

    return(
        <>
        <h2 className="font-display font-semibold text-2xl text-gray-500 p-4">
              Diseña tu invitación
            </h2>

            <div className="w-full rounded-xl bg-secondary shadow-lg py-3 mb-10 px-6">
              <p className=" font-display">
                Encuentra a un diseñador para tu invitación
              </p>
            </div>

            <Banner />
        </>
    )

}