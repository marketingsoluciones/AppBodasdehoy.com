import { FC, useEffect, useRef, useState } from "react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const useScreenSize = () => {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleResize = () => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
    console.log(window.innerWidth, "x", window.innerHeight)
  };

  return { width, height };
};

const handleScale = (valorX: any, valorY: any, lienzo: any): any => {

  const s = { x: 0, y: 0 }
  if (valorX > 767) {
    valorX = valorX / 12 * 9
    valorY = valorY - 144
  } else {
    valorY = valorY / 2
  }
  s.x = valorX * 100 / lienzo.ancho
  s.y = valorY * 100 / lienzo.alto
  if (s.x < s.y) {
    console.log(123, valorX, valorY, lienzo, "result:", s.x, "noResult:", s.y)
    return s.x
  }
  console.log(123, valorX, valorY, lienzo, "result:", s.y, "noResult:", s.x)
  return s.y
}

const Prueba: FC = () => {
  let { width, height } = useScreenSize()
  const [scrX, setScrX] = useState(0)
  const [scrY, setScrY] = useState(0)
  const [reset, setReset] = useState(false)
  const [scale, setScale] = useState(0)
  const [oculto, setOculto] = useState(true)
  const lienzo = {
    ancho: 2048,
    alto: 800
  }

  useEffect(() => {
    setScrX(window.innerWidth)
    setScrY(window.innerHeight)
    const scaleResult = handleScale(window.innerWidth, window.innerHeight, lienzo)
    console.log(234567, scaleResult)

    setScale(scaleResult / 100)
    console.log("scala:", scale)
  }, [oculto])

  useEffect(() => {
    if (oculto) {
      const b = document.getElementsByTagName('body')[0]
      console.log(oculto)
      setOculto(false)
    }
    console.log(oculto)
  }, [oculto])

  const handleReset = (funcion: any) => {
    funcion()
    setTimeout(() => {

      setReset(true)
    }, 100);
  }

  return (
    <>
      <div className="bg-orange-500 divOrange flex justify-center " >
        <TransformWrapper
          disabled={false}
          limitToBounds={true}
          initialScale={scale}
          minScale={scale}
          maxScale={6}
          //initialPositionX={500}
          //initialPositionY={500}
          //centerZoomedOut={true}
          centerOnInit={true}
        //minPositionX={0}
        //minPositionY={0}
        //maxPositionX={0}
        //maxPositionY={0}
        >
          {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
            <>
              {!reset ? handleReset(resetTransform) : () => { }}
              <div className="flex items-start gap-3 absolute top-5 left-5">
                <div className="flex flex-col rounded-md w-max h-max bg-white z-40 shadow border border-gray-200  text-xl ">
                  <button
                    className="px-2 py-1 text-gray-500 hover:text-gray-800"
                    onClick={() => zoomIn()}
                  >
                    +
                  </button>
                  <button
                    className="px-2 py-1 text-gray-500 hover:text-gray-800"
                    onClick={() => zoomOut()}
                  >
                    -
                  </button>
                </div>
                <div className="flex flex-col rounded-full w-8 h-8 bg-white z-40 shadow border border-gray-200 top-5 left-5 text-lg items-center justify-center ">
                  <button
                    id="zon"
                    className="px-2 py-1 text-gray-500 hover:text-gray-800"
                    onClick={() => resetTransform()}
                  >
                    x
                  </button>
                </div>
              </div>
              <TransformComponent wrapperClass="contenedor">
                <div className="bg-red border-4 lienzo border-indigo-600 flex justify-center items-center ">
                  {/* eslint-disable-next-line @next/next/no-img-element*/}
                  {/* <img src="https://api.bodasdehoy.com/uploads/3cdc36/kisspng-tuxedo-penguin-desktop-wallpaper-linux-tux-5b3d3f64c6d693.2756473315307405808145-i640.webp" alt="test" /> */}
                  <div className="bg-blue-300 w-[200px] h-[140px] truncate border-2 border-gray-600 ">
                    <span>scrX:{scrX}</span><br />
                    <span>scrY:{scrY}</span><br />
                    <span>width:{width}</span><br />
                    <span>width:{height}</span><br />
                    1 <br />2 <br />3 <br />4 <br />5 <br />6 <br />7 <br />8 <br />9 <br />10 <br />11 <br />12 <br />13 <br />14 <br />15 <br /> 16 <br /> 17 <br />18 <br />
                  </div>
                </div>
              </TransformComponent> </>)}
        </TransformWrapper>
      </div>

      <style >
        {`
          .divOrange {
            width: calc(${width == 0 ? scrX / 12 * 9 : width / 12 * 9}px);
            height: calc(100vh - 144px);
          }
          .contenedor {
            background-color: cyan;
            calc(${width == 0 ? scrX / 12 * 9 : width / 12 * 9}px);
            height: calc(100vh - 144px);
          }
          .div3 {
            background-color: white;
          }
          .lienzo {
            width: ${lienzo.ancho}px;
            height: ${lienzo.alto}px;
          }

          @media (max-width: 767px) and (orientation: portrait) {
            .divOrange {
              width: calc(${scrX}px - 30px);
              height: calc(100vh - 144px);
            }
            .contenedor {
              background-color: cyan;
              width: calc(${scrX}px - 30px);
              height: calc(100vh / 2);
            }
            .div3 {
              background-color: yellow;
            }
          }
        `}
      </style>
    </>
  )
}

export default Prueba