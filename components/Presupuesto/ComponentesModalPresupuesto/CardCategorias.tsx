import { getCurrency } from "../../../utils/Funciones";

interface CardCategoriasProps {
    titulo?: string;
    items?: any[];
}



export const CardCategorias = ({ titulo = "hola", items }: CardCategoriasProps) => {

    return (
        <div className="flex flex-col border bg-gray-200 p-4 rounded-lg shadow-md text-sm capitalize   "
            style={{
                breakInside: 'avoid', // Evita que las tarjetas se rompan
            }}
        >
            <h2 className="font-bold mb-4 text-xl text-azulCorporativo">{titulo}</h2>
            <ul className="space-y-2">
                {items?.map((item, index) => (
                    <li
                        key={index}
                        className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm"
                    >
                        <span className="text-gray-700 w-[70%]">{item.nombre ? item.nombre : ' Nueva part. de gasto'}</span>
                        <span className="font-semibold text-azulCorporativo">
                            {getCurrency(item.coste_final.toFixed(2))}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};