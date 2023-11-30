import Banner from "./Banner"

export const FooterComponent = () => {

  return (
    <div className="w-full -translate-y-4">
      {/* <h2 className="font-display font-semibold text-2xl text-gray-500 p-4">
              Diseña tu invitación
            </h2> */}

      <div className="w-full rounded-xl bg-secondary shadow-lg px-6">
        <p className=" font-display">
          Encuentra a un diseñador para tu invitación
        </p>
      </div>

      <Banner />
    </div>
  )

}