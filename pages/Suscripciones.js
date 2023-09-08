import Script from "next/script"

const Suscripciones = () => {


  return (
    <>
      <div className="  py-20 ">
        {
          true ? <div className="">
            <Script async src="https://js.stripe.com/v3/pricing-table.js"></Script>
            <stripe-pricing-table pricing-table-id="prctbl_1No7YEIUSdlgn0XNDLV0kNgK"
              publishable-key="pk_test_nyHp6UvsADBtFr6LUquKdgPP">
            </stripe-pricing-table>

          </div> : <div>
            <Script async src="https://js.stripe.com/v3/pricing-table.js"></Script>
            <stripe-pricing-table pricing-table-id="prctbl_1No7gNIUSdlgn0XNG1io0Uyx"
              publishable-key="pk_test_nyHp6UvsADBtFr6LUquKdgPP">
            </stripe-pricing-table>
          </div>
        }
      </div>
    </>
  )
}

export default Suscripciones

