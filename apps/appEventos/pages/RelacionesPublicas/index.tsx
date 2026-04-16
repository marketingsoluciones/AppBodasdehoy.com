import { useEffect, useState } from "react";
import LosIracundosWeb from "../../components/RRPP/LosIracundosWeb";
import { fetchApiBodas, queries } from "../../utils/Fetching";


const Slug = () => {
    const [data, setData] = useState({})
    //fetch para obtener la data de todos los productos de stripe
    useEffect(() => {
        const fetchData = async () => {
            const data = JSON?.parse(await fetchApiBodas({
                query: queries.getAllProducts,
                variables: {},
                development: "bodasdehoy"
            }));
            const asd = data.reduce((acc, item) => {
                if (!acc.modulos.includes(item.metadata.grupo)) {
                    acc.modulos.push(item.metadata.grupo)
                }
                return acc
            }, { modulos: [] })
            setData({ data, ...asd })
        }
        fetchData()
    }, [])

    return (
        <div className="w-[100%] h-[100%] items-center justify-center">
            <div id="rootElement" />
            <LosIracundosWeb data={data} />
        </div>
    );
};

export default Slug;

