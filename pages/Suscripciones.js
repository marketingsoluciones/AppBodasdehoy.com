import Script from "next/script"

const Suscripciones = () => {


  return (
    <>
      <div className="  py-5 bg-base  ">
        <div className="flex justify-center pb-10 font-body text-3xl text-center text-primary ">
          <p> Optimiza tus eventos con acceso completo <br /> a herramientas y servicios</p>
        </div>
        {
          <div className="">
            <Script async src="https://js.stripe.com/v3/pricing-table.js"></Script>
            <stripe-pricing-table pricing-table-id="prctbl_1NpC5HIUSdlgn0XN3DUgc0ce"
              publishable-key="pk_test_nyHp6UvsADBtFr6LUquKdgPP">
            </stripe-pricing-table>
          </div>
        }
      </div>
    </>
  )
}

export default Suscripciones

