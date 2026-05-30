import { fetchApiBodas } from "../utils/Fetching";

// Mutaciones invitados: migradas de apiapp (editInvitado/borraInvitado) a api-mcp canónico
// (actualizarInvitado/removerInvitado). Los 3 consumers de BorrarInvitado son fire-and-forget;
// EditarInvitado mantiene shape de retorno {editInvitado:{...invitado}} extrayendo el invitado del evento.

export const EditarInvitado = async (
  eventoID: string,
  invitadoID: string,
  variable_reemplazar: string,
  valor_reemplazar: any,
) => {
  const result = await fetchApiBodas({
    query: `mutation($evento_id:ID!,$invitado_id:String!,$datos:JSON!){
      actualizarInvitado(evento_id:$evento_id, invitado_id:$invitado_id, datos:$datos){
        success
        errors{ field message code }
        evento{ _id invitados_array }
      }
    }`,
    variables: {
      evento_id: eventoID,
      invitado_id: invitadoID,
      datos: { [variable_reemplazar]: valor_reemplazar },
    },
  });
  const invitado = (result?.evento?.invitados_array ?? []).find(
    (i: any) => (i?._id?.toString?.() ?? i?._id ?? i?.id) === invitadoID,
  );
  return { editInvitado: invitado ?? null };
};

export const BorrarInvitado = async (eventoID: string, invitadoID: string) => {
  return await fetchApiBodas({
    query: `mutation($evento_id:ID!,$invitado_id:String!){
      removerInvitado(evento_id:$evento_id, invitado_id:$invitado_id){
        success
        errors{ field message code }
      }
    }`,
    variables: { evento_id: eventoID, invitado_id: invitadoID },
  });
};
