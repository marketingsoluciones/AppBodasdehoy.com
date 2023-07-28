export const Email = () =>{
    return(
        <>
        <div className="flex flex-col justify-center items-center space-y-5 w-full font-display px-10 md:px-0">
            <p className="text-xl text-primaryOrg">Crea gratis todos los eventos que desees, sin límites de invitados</p>
            <div className="flex space-x-4"> 
                <input type="text" placeholder="Email"  className=" border-none w-full rounded-lg"/>
                <button className="w-36 h-10 rounded-lg text-white bg-primaryOrg"> EMPEZAR </button>
            </div>
        </div>
        </>
    )
}