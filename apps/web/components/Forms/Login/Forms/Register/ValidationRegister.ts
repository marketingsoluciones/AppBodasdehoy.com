import * as yup from "yup";

export const ValidationSchemaRegister = {
  // ########### USER #############

  // Schema de validacion user con todos los valores
  userValidationTotal: yup.object().shape({
    fullName: yup.string().required("Campo requerido"),
    email: yup.string().email().required("Campo requerido"),
    password: yup.string().required("Campo requerido").min(8),
    //cuntry: yup.string().required("Campo requerido"),
    //weity: yup.string().required("Campo requerido"),
    //coddingDate: yup.date().required("Campo requerido"),
    phoneNumber: yup.number().required("Campo requerido"),
  }),
  // Schema de validacion user con valores parciales
  userValidationPartial: yup.object().shape({
    city: yup.string().required("Campo requerido"),
    country: yup.string().required("Campo requerido"),
    weddingDate: yup.date().required("Campo requerido"),
    phoneNumber: yup.number().required("Campo requerido"),
  }),

  // ########### BUSINESS #############

  // Schema de validacion business con todos los valores
  businessValidationTotal: yup.object().shape({
    fullName: yup.string().required("Campo requerido"),
    email: yup.string().email().required("Campo requerido"),
    password: yup.string().required("Campo requerido").min(8),
    phoneNumber: yup.number().required("Campo requerido"),
  }),
  // Schema de validacion business con valores parciales
  businessValidationPartial: yup.object().shape({
    fullName: yup.string().required("Campo requerido"),
    phoneNumber: yup.number().required("Campo requerido"),
  }),
};
