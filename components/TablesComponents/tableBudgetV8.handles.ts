import { tr } from "date-fns/locale"
import { fetchApiEventos, queries } from "../../utils/Fetching"
import { error } from "console"

export const handleChange: any = ({ values, info, event, setEvent }) => {

  try {
    const original = info.row.original

    if (original.object === "item" && (!["categoria", "gasto"].includes(values.accessor))) {
      console.log("aqui", original, values?.accessor, original.object === "item", !["categoria", "gasto"].includes(values.accessor))
      const f1 = event.presupuesto_objeto.categorias_array.findIndex(elem => elem._id === original?.categoriaID)
      const f2 = event.presupuesto_objeto.categorias_array[f1].gastos_array.findIndex(elem => elem._id === original?.gastoID)
      const f3 = event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].items_array.findIndex(elem => elem._id === original?.itemID)
      event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].items_array[f3][values.accessor] = values.value
      if (values.accessor === "unidad" && values.value === "xUni.") {
        event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].items_array[f3].cantidad = 0
        fetchApiEventos({
          query: queries.editItemGasto,
          variables: {
            evento_id: event?._id,
            categoria_id: original?.categoriaID,
            gasto_id: original?.gastoID,
            itemGasto_id: original?.itemID,
            variable: "cantidad",
            valor: 0
          }
        })
      }
      setEvent({ ...event })
      fetchApiEventos({
        query: queries.editItemGasto,
        variables: {
          evento_id: event?._id,
          categoria_id: original?.categoriaID,
          gasto_id: original?.gastoID,
          itemGasto_id: original?.itemID,
          variable: values.accessor,
          valor: values.value
        }
      }).then((result: any) => {
        return
      }).catch((error) => {
        console.log(error);
      })
    }
    if ((original.object === "gasto" && (!["categoria"].includes(values.accessor)) || (original.object === "item" && values.accessor === "gasto"))) {
     console.log("entrando")
      const f1 = event.presupuesto_objeto.categorias_array.findIndex(elem => elem._id === original?.categoriaID)
      const f2 = event.presupuesto_objeto.categorias_array[f1].gastos_array.findIndex(elem => elem._id === original?.gastoID)
      event.presupuesto_objeto.categorias_array[f1].gastos_array[f2][values.accessor === "gasto" ? "nombre" : values.accessor] = values.value
      setEvent({ ...event })
      fetchApiEventos({
        query: queries.editGasto,
        variables: {
          evento_id: event?._id,
          categoria_id: original?.categoriaID,
          gasto_id: original?.gastoID,
          variable_reemplazar: values.accessor === "gasto" ? "nombre" : values.accessor,
          valor_reemplazar: values.value
        }
      }).then((result: any) => {
        return
      }).catch((error) => {
        console.log(error);
      })
    }
    if (original.object === "categoria" || (original.object === "gasto" && values.accessor === "categoria") || (original.object === "item" && values.accessor === "categoria")) {
      const f1 = event.presupuesto_objeto.categorias_array.findIndex(elem => elem._id === original?.categoriaID)
      event.presupuesto_objeto.categorias_array[f1].nombre = values.value
      setEvent({ ...event })
      fetchApiEventos({
        query: queries.editCategoria,
        variables: {
          evento_id: event?._id,
          categoria_id: original?.categoriaID,
          nombre: values.value
        }
      }).then((result: any) => {
        return
      }).catch((error) => {
        console.log(error);
      })
    }
  } catch (error) {
    console.log(error)
  }
}

export const determinatedPositionMenu = ({ e, element = undefined, height = 0, width = 0 }): { aling: "top" | "botton", justify: "start" | "end" } => {
  const trElement = element as HTMLElement ?? e.currentTarget as HTMLElement//e.currentTarget.offsetParent as HTMLElement 
  const tableElement = trElement.offsetParent as HTMLElement
  const aling = trElement.offsetTop + height + 30 > tableElement.scrollTop + tableElement.clientHeight
    ? "botton"
    : "top"
  const justify = trElement.offsetLeft + width > tableElement.clientWidth - 20
    ? "end" : "start"

  return { justify, aling }
}

export const handleDelete = ({ showModalDelete, event, setEvent, setLoading, setShowModalDelete }) => {
  try {
    const { values } = showModalDelete
    setLoading(true)
    new Promise(resolve => {
      if (values?.object === "categoria") {
        fetchApiEventos({
          query: queries.borraCategoria,
          variables: {
            evento_id: event?._id,
            categoria_id: values?._id,
          },
        }).then(result => {
          const f1 = event.presupuesto_objeto.categorias_array.findIndex(elem => elem._id === values?._id)
          event.presupuesto_objeto.categorias_array.splice(f1, 1)
          resolve(event)
        })
      }
      if (values?.object === "gasto") {
        fetchApiEventos({
          query: queries.borrarGasto,
          variables: {
            evento_id: event?._id,
            categoria_id: values?.categoriaID,
            gasto_id: values?._id,
          },
        }).then(result => {
          const f1 = event.presupuesto_objeto.categorias_array.findIndex(elem => elem._id === values?.categoriaID)
          const f2 = event.presupuesto_objeto.categorias_array[f1].gastos_array.findIndex(elem => elem._id === values?._id)
          event.presupuesto_objeto.categorias_array[f1].gastos_array.splice(f2, 1)
          resolve(event)
        })
      }
      if (values?.object === "item") {
        fetchApiEventos({
          query: queries.borrarItemsGastos,
          variables: {
            evento_id: event?._id,
            categoria_id: values?.categoriaID,
            gasto_id: values?.gastoID,
            itemsGastos_ids: [values?._id],
          },
        }).then(result => {
          const f1 = event.presupuesto_objeto.categorias_array.findIndex(elem => elem._id === values?.categoriaID)
          const f2 = event.presupuesto_objeto.categorias_array[f1].gastos_array.findIndex(elem => elem._id === values?.gastoID)
          const f3 = event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].items_array.findIndex(elem => elem._id === values._id)
          event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].items_array.splice(f3, 1)
          resolve(event)
        })
      }
    }).then((result) => {
      setEvent({ ...event })
      showModalDelete["setShowDotsOptionsMenu"] && showModalDelete?.setShowDotsOptionsMenu({ state: false })
      setShowModalDelete({ state: false })
      setLoading(false)
    })
  } catch (error) {
    console.log(error)
  }
}

export const handleCreateItem = async ({ info, event, setEvent, setShowDotsOptionsMenu }) => {
  try {
    fetchApiEventos({
      query: queries.nuevoItemGasto,
      variables: {
        evento_id: event?._id,
        categoria_id: info?.row?.original?.categoriaID,
        gasto_id: info?.row?.original?.gastoID,
        itemGasto: {
          nombre: "Nuevo Item",
          cantidad: 1,
          valor_unitario: 0,
          total: 0,
          unidad: "xUni.",
          estatus: false
        }
      },
    }).then((result) => {
      setShowDotsOptionsMenu({ state: false })
      const f1 = event.presupuesto_objeto.categorias_array.findIndex((elem) => elem._id === info?.row?.original?.categoriaID)
      const f2 = event.presupuesto_objeto.categorias_array[f1].gastos_array.findIndex((elem) => elem._id == info?.row?.original?.gastoID)
      event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].items_array.push(result)
      setEvent({ ...event })
    })
  } catch (error) {
    console.log(220045, error);
    throw new Error(error)
  }
}

export const handleCreateGasto = async ({ info, event, setEvent, setShowDotsOptionsMenu }) => {
  try {
    fetchApiEventos({
      query: queries.nuevoGasto,
      variables: {
        evento_id: event?._id,
        categoria_id: info?.row?.original?.categoriaID,
        nombre: "Nueva part. de gasto",
      }
    }).then((result) => {
      console.log(result)
      setShowDotsOptionsMenu({ state: false })
      const f1 = event.presupuesto_objeto.categorias_array.findIndex((elem) => elem._id === info?.row?.original?.categoriaID)
      event.presupuesto_objeto.categorias_array[f1].gastos_array.push(result)
      setEvent({ ...event })
    })
  } catch (error) {
    console.log(220046, error);
    throw new Error(error)
  }
}

export const handleCreateCategoria = async ({ info, event, setEvent, setShowDotsOptionsMenu }) => {
  try {
    fetchApiEventos({
      query: queries.nuevoCategoria,
      variables: {
        evento_id: event?._id,
        nombre: "Nueva categoría",
      }
    }).then((result) => {
      console.log(100062, result)
      setShowDotsOptionsMenu({ state: false })
      event.presupuesto_objeto.categorias_array.push(result)
      setEvent({ ...event })
    })
  } catch (error) {
    console.log(220047, error);
    throw new Error(error)
  }
}