export const GridButtons = () => {

    const DataButton = [
        {
            title: "Boda",
            router: "/",
        },
        {
            title: "Aniversarios",
            router: "/",
        },
        {
            title: "Comuniones",
            router: "/",
        },
        {
            title: "Graduaciones",
            router: "/",
        },
        {
            title: "Bar Mitzvah",
            router: "/",
        },
        {
            title: "Bautizo",
            router: "/",
        },
    ]

    return (
        <>
            <div className="grid md:grid-cols-2  font-display px-10">
                <div className="space-y-3 flex flex-col items-end ">
                    <div>
                        <img src="/logo.png" alt="logo" />
                    </div>
                    <p className="text-right text-2xl md:w-[40%] text-primaryOrg ">
                        Te facilita la organización y gestión de estos eventos y más…
                    </p>
                </div>
                <div className="grid md:grid-cols-3 p-14">
                    {
                        DataButton.map((item, idx) => (
                                <button key={idx} className="text-primaryOrg border-2 m-2 rounded-3xl border-primaryOrg ">
                                    {item.title}
                                </button>
                        ))
                    }
                </div>
            </div>
        </>
    )
}