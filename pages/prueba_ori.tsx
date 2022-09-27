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
  const [body, setBody]: any = useState({ x: 0, y: 0 })
  const [ini, setIni]: any = useState({ x: 1, y: 0 })
  const [box, setBox]: any = useState({ x: 0, y: 0 })
  const [end, setEnd]: any = useState({ x: 0, y: 0 })
  const [h, setH]: any = useState("")
  const [scrX, setScrX] = useState(0)
  const [scrY, setScrY] = useState(0)
  const [reset, setReset] = useState(false)
  const [pruebaReset, setPruebaReset]: any = useState(() => { })
  const [scale, setScale] = useState(0)
  const [styl, setStyl] = useState("")
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

      //document.getElementById("lienzo").style.width = `${b.clientWidth - 100}px`
      console.log(oculto)
      setOculto(false)
    }
    console.log(oculto)
  }, [oculto])

  useEffect(() => {
    console.log("width", width)
    //document.getElementById("lienzo").style.width = `${width - 100}px`
    // setScr(width)
  }, [width])
  // useEffect(() => {
  //   console.log("scr", scr)
  // }, [scr])

  // const scale = () => {
  //   const scale = { x: 0, y: 0 }
  //   if (width == 0) {
  //     scale.x = lienzo.ancho * 100 / (scrX / 12 * 9)
  //     scale.y = lienzo.alto * 100 / (scrY / 12 * 9)
  //     if (scale.x < scale.y) return scale.x
  //     return scale.y
  //   }
  //   if (width != 0) {
  //     scale.x = lienzo.ancho * 100 / (width / 12 * 9)
  //     scale.y = lienzo.alto * 100 / (width / 12 * 9)
  //     if (scale.x < scale.y) return scale.x
  //     return scale.y
  //   }
  // }



  // useEffect(() => {
  //   const b = document.getElementsByTagName('body')[0]
  //   console.log("body", b.clientHeight)
  //   setBody({ x: b.clientWidth, y: b.clientHeight })
  //   const ini = document.querySelector('.f-top');
  //   console.log(ini.clientWidth, ini.clientHeight)
  //   setIni({ x: ini.clientWidth, y: ini.clientHeight })
  //   const end = document.querySelector('.f-bottom');
  //   setEnd({ x: end.clientWidth, y: end.clientHeight })
  //   console.log(end.clientWidth, end.clientHeight)
  //   const box = document.querySelector('.box');
  //   setBox({ x: box.clientWidth, y: box.clientHeight })
  //   console.log(box.clientWidth, box.clientHeight)
  //   setScr(window.innerHeight)
  // }, [])
  // useEffect(() => {
  //   const dfg = body.x
  //   setStyl(`bg-blue-500 w-[${dfg}px] h-[360px] relative`)
  //   // const asd = `h-[${window.innerHeight - ini.y - end.y}px]`
  //   // console.log(1256789, asd, window.innerHeight, ini.y)
  //   // setH(asd)

  //   window.scroll({
  //     top: 672,
  //     behavior: 'smooth'
  //   });
  //   //document.getElementById("prue").style.background = "orange";
  //   //document.getElementById("prue").style.width = `${body.x - 200}px`;
  // }, [body])
  const handleReset = (funcion: any) => {
    funcion()
    setTimeout(() => {

      setReset(true)
    }, 100);
  }

  return (
    <>
      <section className="bg-red" hidden={oculto}>
        {/* <div className="bg-green">
          primera
        </div> */}
        {/* <div className="absolute div3 w-20 h-20">
          <span>width:{width}</span><br />
          <span>scr:{scr}</span>
        </div> */}
        {/* <div className="md:grid md:grid-cols-12"> */}
        <div className="bg-blue-500 h-[calc(100vh-144px)] flex justify-center items-center md:col-span-9" >
          <div className="bg-orange-500 divOrange flex justify-center items-end md:items-end" >
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

          {/* </div> */}
        </div>
      </section>
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
      {/* <section className={`box bg-red w-full grid h-screen md:h-[calc(100vh-144px)] md:grid-cols-12 bg-base overflow-hidden`}>
        <div className={` ${true ? "flex" : "hidden"} bg-green col-span-3 h-20 md:h-full 
          md:block flex px-2 
          flex-col gap-6
          z-10   box-border 
          transform
          transition duration-700 overflow-y-auto`}>
          body {body.x} x {body.y}<br />
          arriba {ini.x} x {ini.y} <br />
          centro {box.x} x {box.y} <br />
          abajo {end.x} x {end.y} <br />
          screnn {scr}<br />
          <br />
          1 <br />2 <br />3 <br />4 <br />5 <br />6 <br />7 <br />8 <br />9 <br />10 <br />11 <br />12 <br />13 <br />14 <br />15 <br /> 16 <br /> 17 <br />18 <br />
        </div>
        <div className="bg-blue-500 h-[600px] md:col-span-9 pl-1 relative flex justify-center items-center">
          <div id="prue" className="h-20 ">hello</div>

        </div>
      </section> */}
      {/* <div className={`box bg-red w-full h-screen md:h-[calc(100vh-144px)]`}>
        <div className="bg-green w-[341px] h-full">
          body {body} <br />
          arriba {ini.x} x {ini.y} <br />
          centro {box.x} x {box.y} <br />
          abajo {end.x} x {end.y} <br />
          screnn {scr}
        </div>
      </div> */}

      {/* <style jsx>
        {`
          section {
            height: calc(100vh - 9rem);
          }
        `}
      </style> */}
    </>
  )
}

export default Prueba