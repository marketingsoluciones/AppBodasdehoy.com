import { Formik, Form, ErrorMessage } from "formik";
import { FC } from "react";
import { useToast } from "../../../../hooks/useToast";
import { useAuthentication } from "../../../../utils/Authentication";
import { ButtonComponent } from "../../ButtonComponent";
import { InputField } from "../../InputFieldIcons";
import { EmailIcon } from "../../../icons";
import { useTranslation } from 'react-i18next';

type MyFormValues = {
  identifier: string;
  wrong: any;
};

const FormResetPassword: FC<any> = ({ setStage }) => {
  const { resetPassword } = useAuthentication();
  const toast = useToast()
  const initialValues: MyFormValues = {
    identifier: "",
    wrong: "",
  };

  const errorsCode: any = {
    "auth/wrong-password": "Correo o contraseña invalida",
    "auth/too-many-requests":
      "Demasiados intentos fallidos. Intenta de nuevo más tarde",
  };

  const handleSubmit = async (values: MyFormValues, actions: any) => {
    try {
      resetPassword(values, setStage)
    } catch (error: any) {
      console.error(JSON.stringify(error));
      toast("error", JSON.stringify(errorsCode[error.code]))
    }
  };
  const { t } = useTranslation();

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      <Form className="text-gray-200 flex flex-col gap-4 *py-2 w-full md:w-3/4">
        <h1 className="text-primary mt-20">{t("resetyourpassword")}</h1>
        <span className="w-full relative mt-8 mb-12">
          <InputField
            label={t("email")}
            name="identifier"
            //placeholder="jhondoe@gmail.com" 
            type="email"
            icon={<EmailIcon className="absolute w-4 h-4 inset-y-0 left-4 m-auto text-gray-500" />} />
        </span>
        <span className="text-sm text-red">
          <ErrorMessage name="wrong" />
        </span>

        <ButtonComponent
          type="submit"
        >
          {t("send")}
        </ButtonComponent>
      </Form>
    </Formik>
  );
};

export default FormResetPassword;
