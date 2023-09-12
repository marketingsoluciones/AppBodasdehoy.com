import { Formik, Form } from "formik"
import ChangeSelectField from "../Forms/ChangeSelectField"
import { EventContextProvider } from "../../context";

export const SelectMoneda = () => {
  const {  setCurrencyState } = EventContextProvider();
    const initialValues = {
        moneda: "",
    }
    const handleBlurData = (variable:string, value:string) => {
        setCurrencyState(value)
    }

    return (
        <>
            <Formik
                initialValues={initialValues}
                onSubmit={null}
            >
                <Form>
                    <ChangeSelectField
                        options={["USD", "EUR"]}
                        name="moneda"
                        label="Seleciona el tipo de moneda:"
                        onChangeCapture={(e: any) => handleBlurData("moneda", e?.target?.value)}
                    />
                </Form>
            </Formik>
        </>
    )
}