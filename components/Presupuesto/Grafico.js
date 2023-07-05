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
      <div className="w-full h-full md:mb-2 md:h-max bg-white rounded-xl shadow-md flex justify-center  md:py-6 pt-6  ">
        <div className="md:w-3/5 h-full  ">
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
              className: "data",
              labels: labels,
              datasets: [
                {
                  label: "Categorias",
                  data: data,
                  backgroundColor: ["#F7628C", "#87F3B5", "#FBFF4E", "#F2F2F2", "#DC7633", "#BFC9CA", "#2C3E50", "C0392B", "#AF7AC5", "#0E6251", "#FF00FF", "#641E16", "#CCFF00", "#00E3FF"],
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
            
          },
          .data{
            display: 

          }
        `}
      </style>
    </>
  );
};

export default Grafico;
