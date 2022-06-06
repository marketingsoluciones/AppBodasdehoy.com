import { Doughnut } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { capitalize } from "../../utils/Capitalize";

const Grafico = ({ categorias }) => {
  const [labels, setLabels] = useState()
  const [data, setData] = useState()

  const DefinirData = () => {
    return categorias?.map(item => {
      if (item.coste_final >= item.coste_estimado) {
        return item.coste_final.toFixed(2)
      } else {
        return item.coste_estimado.toFixed(2)
      }
    })
  }

  useEffect(() => {
    setData(DefinirData())
    setLabels(categorias?.map(item => capitalize(item.nombre)))
  }, [categorias])

  return (
    <>
      <div className="w-full h-max bg-white rounded-xl shadow-md grid grid place-items-center py-6 ">
        <div className="w-3/5">
          <Doughnut
            type="Doughnut"
            className="chart"
            options={{
              plugins: {
                legend: {
                  position: "bottom",
                  align: "start",
                  labels: {
                    font: {
                      size: 12,
                      family: "Poppins"
                    }
                  }
                },
              },

            }}

            data={{
              labels: labels,
              datasets: [
                {
                  label: "Categorias",
                  data: data,
                  backgroundColor: ["#F7628C", "#87F3B5", "#FBFF4E", "#F2F2F2"],
                  borderWidth: 0,
                },
              ],
            }}
          />
        </div>
      </div>
      <style jsx>
        {`
          .chart {
            display: flex !important;
            cursor: pointer;
          }
        `}
      </style>
    </>
  );
};

export default Grafico;
