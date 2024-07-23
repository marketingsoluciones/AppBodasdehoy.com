import { AuthContextProvider } from "../../context"
import { FC, useState } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { createURL } from "../../utils/UrlImage";
import { useToast } from '../../hooks/useToast';
import { image } from "../../utils/Interfaces";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { LoadingItem } from "../Loading";


export const PerfilFoto = () => {
    const { user } = AuthContextProvider()
    return (
        <div className="w-full flex flex-col items-center justify-center gap-2">
            <ImageProfile />
            <input type="file" id="photo" name="photo" className="hidden" />
            <h2 className="text-xl font-semibold w-full text-center text-tertiary">{user?.displayName}</h2>
            <div className="w-fit flex items-center gap-1 text-tertiary -mt-3">
                <small className="text-gray-700">{user?.role && user.role.length > 0 && user?.role[0]}</small>
                |
                <small>{user?.city}</small>
            </div>
        </div>
    )
}

const ImageProfile: FC = () => {
    const auth = getAuth()
    const { user, setUser, config } = AuthContextProvider()
    const [loading, setLoading] = useState<boolean>(false)
    const toast = useToast();


    const handleChange = async (e: any) => {
        setLoading(true)
        try {
            const file = e.target.files[0]
            const reader = new FileReader();

            reader.onloadend = async () => {
                const result: Partial<image> = await fetchApiBodas(
                    {
                        query: queries.singleUpload,
                        variables: { file, use: "profile" },
                        type: "formData",
                        development: config?.development
                    }
                )

                if (result?.i640 && auth?.currentUser) {
                    await updateProfile(auth.currentUser, {
                        photoURL: createURL(result.i640)
                    })

                    setUser(old => ({ ...old, photoURL: createURL(result.i640) }))
                }
            }
            reader.readAsDataURL(file);
            toast("success", "la imagen fue actualizado con exito")
            setTimeout(() => {
                setLoading(false)
            }, 500);
        } catch (error) {
            setTimeout(() => {
                setLoading(false)
            }, 500);
            toast("error", "error al cargar la imagen")
            console.log(error)
        }

    }

    return (
        <div>
            <label htmlFor="photo" className={"relative"}>
                <img src={user?.photoURL ?? "/placeholder/user.png"} alt={"perfil"} className={"border-primary border-2 rounded-full objeto-cover h-40 w-40 hover:opacity-50 cursor-pointer object-cover object-center"} />
                {loading && (
                    <div className="flex items-center justify-center h-40 w-40 rounded-full bg-primary bg-opacity-90 absolute top-0 left-0 text-white">
                        <LoadingItem size="small" text="Cargando" />
                    </div>
                )}
            </label>
            <input type="file" id="photo" name="photo" className="hidden" onChange={handleChange} />
        </div>

    );
}