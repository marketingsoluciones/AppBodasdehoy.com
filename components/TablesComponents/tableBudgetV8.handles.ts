import { Dispatch, SetStateAction, useState } from "react"
import { fetchApiEventos, queries } from "../../utils/Fetching"
import { Event, item, expenses, estimateCategory } from "../../utils/Interfaces"

interface propsHandleChange {
  values: any
  info: any
  event: Event
  setEvent: Dispatch<SetStateAction<Event>>
}

export const handleChange = ({ values, info, event, setEvent }: propsHandleChange) => {
  try {
    const original = info.row.original

    if (original.object === "item" && (!["categoria", "gasto"].includes(values.accessor))) {
      const f1 = event?.presupuesto_objeto?.categorias_array.findIndex(elem => elem._id === original?.categoriaID)
      const f2 = event?.presupuesto_objeto?.categorias_array[f1].gastos_array.findIndex(elem => elem._id === original?.gastoID)
      const f3 = event?.presupuesto_objeto?.categorias_array[f1].gastos_array[f2].items_array.findIndex(elem => elem._id === original?.itemID)
      
      // Actualizar el valor en el estado inmediatamente
      event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].items_array[f3][values.accessor] = values.value !== "" ? values.value : (values.accessor === "nombre" ? "nuevo item" : 0)

      // Si se cambió la unidad a xUni., resetear cantidad si es necesario
      if (values.accessor === "unidad" && values.value === "xUni.") {
        event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].items_array[f3].cantidad = 0
        // Actualizar cantidad en backend
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
        }).catch(error => console.log(error))
      }

      // Después de cambiar valores que afectan cálculos, recalcular totales
      if (['cantidad', 'valor_unitario', 'unidad'].includes(values.accessor)) {
        recalculateItemAndGastoTotals(event, f1, f2, f3)
      }

      setEvent({ ...event })
      
      // Actualizar en backend
      fetchApiEventos({
        query: queries.editItemGasto,
        variables: {
          evento_id: event?._id,
          categoria_id: original?.categoriaID,
          gasto_id: original?.gastoID,
          itemGasto_id: original?.itemID,
          variable: values.accessor,
          valor: values.value !== "" ? values.value : (values.accessor === "nombre" ? "nuevo item" : 0)
        }
      }).then((result: any) => {
        return
      }).catch((error) => {
        console.log(error);
      })
    }
    
    if ((original.object === "gasto" && (!["categoria"].includes(values.accessor)) || (original.object === "item" && values.accessor === "gasto"))) {
      const f1 = event?.presupuesto_objeto?.categorias_array.findIndex(elem => elem._id === original?.categoriaID)
      const f2 = event?.presupuesto_objeto?.categorias_array[f1].gastos_array.findIndex(elem => elem._id === original?.gastoID)
      
      // Actualizar el valor en el estado inmediatamente
      event.presupuesto_objeto.categorias_array[f1].gastos_array[f2][values.accessor === "gasto" ? "nombre" : values.accessor] = values.value !== "" ? values.value : "nuevo gasto"
      
      // Si se cambió coste_final de gasto, recalcular totales de categoría
      if (values.accessor === 'coste_final') {
        recalculateCategoriaTotals(event, f1)
      }
      
      setEvent({ ...event })
      
      // Actualizar en backend
      fetchApiEventos({
        query: queries.editGasto,
        variables: {
          evento_id: event?._id,
          categoria_id: original?.categoriaID,
          gasto_id: original?.gastoID,
          variable_reemplazar: values.accessor === "gasto" ? "nombre" : values.accessor,
          valor_reemplazar: values.value !== "" ? values.value : "nuevo gasto"
        }
      }).then((result: any) => {
        return
      }).catch((error) => {
        console.log(error);
      })
    }
    
    if (original.object === "categoria" || (original.object === "gasto" && values.accessor === "categoria") || (original.object === "item" && values.accessor === "categoria")) {
      const f1 = event?.presupuesto_objeto?.categorias_array.findIndex(elem => elem._id === original?.categoriaID)
      event.presupuesto_objeto.categorias_array[f1].nombre = values.value !== "" ? values.value : "nueva categoria"
      setEvent({ ...event })
      
      fetchApiEventos({
        query: queries.editCategoria,
        variables: {
          evento_id: event?._id,
          categoria_id: original?.categoriaID,
          nombre: values.value !== "" ? values.value : "nueva categoria"
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

// Nueva función para recalcular totales de item y gasto automáticamente
const recalculateItemAndGastoTotals = (event: Event, categoriaIndex: number, gastoIndex: number, itemIndex: number) => {
  const totalStimatedGuests = event?.presupuesto_objeto?.totalStimatedGuests || { adults: 0, children: 0 }
  const categoria = event.presupuesto_objeto.categorias_array[categoriaIndex]
  const gasto = categoria.gastos_array[gastoIndex]
  
  // Recalcular total del gasto basado en sus items
  if (gasto.items_array && gasto.items_array.length > 0) {
    let gastoTotal = 0
    
    gasto.items_array.forEach(item => {
      // Calcular cantidad según unidad
      let cantidad = item.cantidad || 0
      switch (item.unidad) {
        case 'xAdultos.':
          cantidad = totalStimatedGuests.adults
          break
        case 'xNiños.':
          cantidad = totalStimatedGuests.children
          break
        case 'xInv.':
          cantidad = totalStimatedGuests.adults + totalStimatedGuests.children
          break
        default:
          cantidad = item.cantidad || 0
      }
      
      const itemTotal = cantidad * (item.valor_unitario || 0)
      gastoTotal += itemTotal
    })
    
    // Actualizar coste_final del gasto
    gasto.coste_final = Math.round(gastoTotal * 100) / 100
  }
  
  // Recalcular total de la categoría
  recalculateCategoriaTotals(event, categoriaIndex)
}

// Nueva función para recalcular totales de categoría
const recalculateCategoriaTotals = (event: Event, categoriaIndex: number) => {
  const categoria = event.presupuesto_objeto.categorias_array[categoriaIndex]
  
  if (categoria.gastos_array && categoria.gastos_array.length > 0) {
    let categoriaTotal = 0
    
    categoria.gastos_array.forEach(gasto => {
      categoriaTotal += gasto.coste_final || 0
    })
    
    // Actualizar coste_final de la categoría
    categoria.coste_final = Math.round(categoriaTotal * 100) / 100
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

interface propsHandleDelete {
  showModalDelete: any
  event: Event
  setEvent: Dispatch<SetStateAction<Event>>
  setLoading: Dispatch<SetStateAction<boolean>>
  setShowModalDelete: Dispatch<SetStateAction<any>>
}

export const handleDelete = ({ showModalDelete, event, setEvent, setLoading, setShowModalDelete }: propsHandleDelete) => {
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
          const f1 = event?.presupuesto_objeto?.categorias_array.findIndex(elem => elem._id === values?._id)
          event?.presupuesto_objeto?.categorias_array.splice(f1, 1)
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
          const f1 = event?.presupuesto_objeto?.categorias_array.findIndex(elem => elem._id === values?.categoriaID)
          const f2 = event?.presupuesto_objeto?.categorias_array[f1].gastos_array.findIndex(elem => elem._id === values?._id)
          event?.presupuesto_objeto?.categorias_array[f1].gastos_array.splice(f2, 1)
          
          // Recalcular totales de categoría después de eliminar gasto
          recalculateCategoriaTotals(event, f1)
          
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
          const f1 = event?.presupuesto_objeto?.categorias_array.findIndex(elem => elem._id === values?.categoriaID)
          const f2 = event?.presupuesto_objeto?.categorias_array[f1].gastos_array.findIndex(elem => elem._id === values?.gastoID)
          const f3 = event?.presupuesto_objeto?.categorias_array[f1].gastos_array[f2].items_array.findIndex(elem => elem._id === values._id)
          event?.presupuesto_objeto?.categorias_array[f1].gastos_array[f2].items_array.splice(f3, 1)
          
          // Recalcular totales después de eliminar item
          recalculateItemAndGastoTotals(event, f1, f2, -1) // -1 indica que ya se eliminó el item
          
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

interface propsHandles {
  setShowDotsOptionsMenu: any
  info: any
  event: Event
  setEvent: Dispatch<SetStateAction<Event>>
}

export const handleCreateItem = async ({ info, event, setEvent, setShowDotsOptionsMenu }: propsHandles) => {
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
    }).then((result: item) => {
      setShowDotsOptionsMenu({ state: false })
      const f1 = event?.presupuesto_objeto?.categorias_array.findIndex((elem) => elem._id === info?.row?.original?.categoriaID)
      const f2 = event?.presupuesto_objeto?.categorias_array[f1].gastos_array.findIndex((elem) => elem._id == info?.row?.original?.gastoID)
      event?.presupuesto_objeto?.categorias_array[f1].gastos_array[f2].items_array.push(result)
      
      // Recalcular totales después de agregar item
      recalculateItemAndGastoTotals(event, f1, f2, -1)
      
      setEvent({ ...event })
    })
  } catch (error) {
    console.log(220045, error);
    throw new Error(error)
  }
}

export const handleCreateGasto = async ({ info, event, setEvent, setShowDotsOptionsMenu }: propsHandles) => {
  try {
    fetchApiEventos({
      query: queries.nuevoGasto,
      variables: {
        evento_id: event?._id,
        categoria_id: info?.row?.original?.categoriaID,
        nombre: "Nueva part. de gasto",
      }
    }).then((result: expenses) => {
      setShowDotsOptionsMenu({ state: false })
      const f1 = event?.presupuesto_objeto?.categorias_array.findIndex((elem) => elem._id === info?.row?.original?.categoriaID)
      event?.presupuesto_objeto?.categorias_array[f1].gastos_array.push(result)
      
      // Recalcular totales de categoría después de agregar gasto
      recalculateCategoriaTotals(event, f1)
      
      setEvent({ ...event })
    })
  } catch (error) {
    console.log(220046, error);
    throw new Error(error)
  }
}

export const handleCreateCategoria = async ({ info, event, setEvent, setShowDotsOptionsMenu }: propsHandles) => {
  try {
    fetchApiEventos({
      query: queries.nuevoCategoria,
      variables: {
        evento_id: event?._id,
        nombre: "Nueva categoría",
      }
    }).then((result: estimateCategory) => {
      setShowDotsOptionsMenu({ state: false })
      event?.presupuesto_objeto?.categorias_array.push(result)
      setEvent({ ...event })
    })
  } catch (error) {
    console.log(220047, error);
    throw new Error(error)
  }
}

export const handleChangeEstatus = async ({ event, categoriaID, gastoId, setEvent }) => {
  const f1 = event?.presupuesto_objeto?.categorias_array.findIndex(elem => elem._id === categoriaID)
  const f2 = event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == gastoId);
  const gastoEstatus = event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2]?.estatus
  console.log("pepe", gastoId)
  try {
    fetchApiEventos({
      query: queries.editGasto,
      variables: {
        evento_id: event?._id,
        categoria_id: categoriaID,
        gasto_id: gastoId,
        variable_reemplazar: "estatus",
        valor_reemplazar: gastoEstatus === null ? false : !gastoEstatus
      }
    }).then((result: any) => {
      event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].estatus = result.categorias_array[f1].gastos_array[f2].estatus
      setEvent({ ...event })
    })
  } catch (error) {
    console.log(220046, error);
    throw new Error(error)
  }
}

export const handleChangeEstatusItem = async ({ event, categoriaID, gastoId, itemId, setEvent }) => {
  const f1 = event?.presupuesto_objeto?.categorias_array.findIndex(elem => elem._id === categoriaID)
  const f2 = event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array.findIndex((item) => item._id == gastoId);
  const f3 = event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2]?.items_array.findIndex((item) => item._id == itemId)
  const ItemEstatus = event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array[f2]?.items_array[f3]?.estatus
  event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].items_array[f3].estatus = !ItemEstatus
  
  try {
    fetchApiEventos({
      query: queries.editItemGasto,
      variables: {
        evento_id: event?._id,
        categoria_id: categoriaID,
        gasto_id: gastoId,
        itemGasto_id: itemId,
        variable: "estatus",
        valor: !ItemEstatus
      }
    }).then((result: any) => {
      console.log('result', result.categorias_array[f1].gastos_array[f2].items_array)
      setEvent({ ...event })
    })
  } catch (error) {
    console.log(220046, error);
    throw new Error(error)
  }
}