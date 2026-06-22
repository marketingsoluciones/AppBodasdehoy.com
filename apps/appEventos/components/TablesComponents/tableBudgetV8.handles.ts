import { Dispatch, SetStateAction, useState } from "react"
import { fetchApiEventos, fetchApiBodas, queries } from "../../utils/Fetching"
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
    /* Para actualizar los items de las partidas de gastos */
    if (original.object === "item" && (!["categoria", "gasto"].includes(values.accessor))) {
      const f1 = event?.presupuesto_objeto?.categorias_array.findIndex(elem => elem._id === original?.categoriaID)
      const f2 = event?.presupuesto_objeto?.categorias_array[f1].gastos_array.findIndex(elem => elem._id === original?.gastoID)
      const f3 = event?.presupuesto_objeto?.categorias_array[f1].gastos_array[f2].items_array.findIndex(elem => elem._id === original?.itemID)
      const newItemValue = values.value !== "" ? values.value : "nuevo item"
      const resetCantidadToZero = values.accessor === "unidad" && values.value === "xUni."
      // Update inmutable del item (con cantidad=0 si aplica).
      setEvent((prev) => ({
        ...prev,
        presupuesto_objeto: {
          ...prev.presupuesto_objeto,
          categorias_array: prev.presupuesto_objeto.categorias_array.map((cat, ci) =>
            ci !== f1 ? cat : {
              ...cat,
              gastos_array: cat.gastos_array.map((gasto, gi) =>
                gi !== f2 ? gasto : {
                  ...gasto,
                  items_array: gasto.items_array.map((item, ii) =>
                    ii !== f3 ? item : {
                      ...item,
                      [values.accessor]: newItemValue,
                      ...(resetCantidadToZero ? { cantidad: 0 } : {}),
                    }
                  ),
                }
              ),
            }
          ),
        },
      }))
      if (resetCantidadToZero) {
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
      fetchApiEventos({
        query: queries.editItemGasto,
        variables: {
          evento_id: event?._id,
          categoria_id: original?.categoriaID,
          gasto_id: original?.gastoID,
          itemGasto_id: original?.itemID,
          variable: values.accessor,
          valor: values.value !== "" ? values.value : "nuevo item"
        }
      }).then((result: any) => {
        /* Para actualizar los totales del item */
        if (original[values.accessor] != values.value) {
          const itemActual = event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].items_array[f3]
          const totalItem = (itemActual?.cantidad ?? 0) * (itemActual?.valor_unitario ?? 0)
          // Update inmutable del total del item.
          setEvent((prev) => ({
            ...prev,
            presupuesto_objeto: {
              ...prev.presupuesto_objeto,
              categorias_array: prev.presupuesto_objeto.categorias_array.map((cat, ci) =>
                ci !== f1 ? cat : {
                  ...cat,
                  gastos_array: cat.gastos_array.map((gasto, gi) =>
                    gi !== f2 ? gasto : {
                      ...gasto,
                      items_array: gasto.items_array.map((item, ii) =>
                        ii !== f3 ? item : { ...item, total: totalItem }
                      ),
                    }
                  ),
                }
              ),
            },
          }))
          if (original.coste_final !== totalItem) {
            fetchApiEventos({
              query: queries.editItemGasto,
              variables: {
                evento_id: event?._id,
                categoria_id: original?.categoriaID,
                gasto_id: original?.gastoID,
                itemGasto_id: original?.itemID,
                variable: "total",
                valor: totalItem
              }
            }).then((result: any) => {
              // Los items ocultos NO deben sumar al total
              const SumaTotalItems = original.gastoOriginal.items_array.reduce((acumulador, item) => {
                // Excluir items ocultos del cálculo
                if (item.estatus === false) {
                  return acumulador;
                }
                return acumulador + (item.total || 0);
              }, 0)
              const sumaTotalesGastos = original.categoriaOriginal.gastos_array.reduce((acumulador, item) => acumulador + (item.coste_final || 0), 0)
              // Update inmutable del coste_final del gasto Y de la categoría.
              setEvent((prev) => ({
                ...prev,
                presupuesto_objeto: {
                  ...prev.presupuesto_objeto,
                  categorias_array: prev.presupuesto_objeto.categorias_array.map((cat, ci) =>
                    ci !== f1 ? cat : {
                      ...cat,
                      coste_final: sumaTotalesGastos,
                      gastos_array: cat.gastos_array.map((gasto, gi) =>
                        gi !== f2 ? gasto : { ...gasto, coste_final: SumaTotalItems }
                      ),
                    }
                  ),
                },
              }))

              if (original.gastoOriginal.coste_final !== SumaTotalItems) {
                fetchApiEventos({
                  query: queries.editGasto,
                  variables: {
                    evento_id: event?._id,
                    categoria_id: original?.categoriaID,
                    gasto_id: original?.gastoID,
                    variable_reemplazar: "coste_final",
                    valor_reemplazar: SumaTotalItems
                  }
                }).then((result: any) => {
                  // El coste_final de la categoría ya se actualizó arriba via setEvent inmutable.
                  // Si necesitamos re-asegurarlo tras la confirmación del backend, sólo aplica
                  // si el valor cambió respecto al cálculo arriba (idempotente).
                  setEvent(prev => ({
                    ...prev,
                    presupuesto_objeto: {
                      ...prev.presupuesto_objeto,
                      categorias_array: prev.presupuesto_objeto.categorias_array.map((cat, ci) =>
                        ci !== f1 ? cat : { ...cat, coste_final: sumaTotalesGastos }
                      ),
                    },
                  }));
                })
              }
            })
          }
          return
        }
        return
      }).catch((error) => {
        console.log(error);
      })
    }


    if ((original.object === "gasto" && (!["categoria"].includes(values.accessor)) || (original.object === "item" && values.accessor === "gasto"))) {
      const f1 = event?.presupuesto_objeto?.categorias_array?.findIndex(elem => elem._id === original?.categoriaID)
      const f2 = event?.presupuesto_objeto?.categorias_array[f1]?.gastos_array.findIndex(elem => elem._id === original?.gastoID)
      const fieldKey = values.accessor === "gasto" ? "nombre" : values.accessor
      const newGastoFieldValue = values.value !== "" ? values.value : "nuevo gasto"
      const sumaTotalesGastos = original?.categoriaOriginal?.gastos_array.reduce((acumulador, item) => acumulador + (item.coste_final || 0), 0)
      // Update inmutable del gasto Y del coste_final de la categoría.
      const nuevasCategorias = event.presupuesto_objeto.categorias_array.map((cat, idx) =>
        idx === f1 ? {
          ...cat,
          coste_final: sumaTotalesGastos,
          gastos_array: cat.gastos_array.map((gasto, gi) =>
            gi !== f2 ? gasto : { ...gasto, [fieldKey]: newGastoFieldValue }
          ),
        } : cat
      );
      setEvent((prev) => ({
        ...prev,
        presupuesto_objeto: {
          ...prev.presupuesto_objeto,
          categorias_array: prev.presupuesto_objeto.categorias_array.map((cat, idx) =>
            idx === f1 ? {
              ...cat,
              coste_final: sumaTotalesGastos,
              gastos_array: cat.gastos_array.map((gasto, gi) =>
                gi !== f2 ? gasto : { ...gasto, [fieldKey]: newGastoFieldValue }
              ),
            } : cat
          ),
        },
      }))
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
        /* Se setea el coste final de las categorias con la variable sumaTotalesGastos */
        if (values.accessor === 'coste_final' && original[values.accessor] !== values.value && original.items_array.length == 0) {
          setEvent(prev => ({
            ...prev,
            presupuesto_objeto: {
              ...prev.presupuesto_objeto,
              categorias_array: nuevasCategorias
            }
          }));
        }
        return
      }).catch((error) => {
        console.log(error);
      })
    }
    if (original.object === "categoria" || (original.object === "gasto" && values.accessor === "categoria") || (original.object === "item" && values.accessor === "categoria")) {
      const f1 = event?.presupuesto_objeto?.categorias_array.findIndex(elem => elem._id === original?.categoriaID)
      const newNombre = values.value !== "" ? values.value : "nueva categoria"
      setEvent((prev) => ({
        ...prev,
        presupuesto_objeto: {
          ...prev.presupuesto_objeto,
          categorias_array: prev.presupuesto_objeto.categorias_array.map((cat, idx) =>
            idx === f1 ? { ...cat, nombre: newNombre } : cat
          ),
        },
      }))
      fetchApiBodas({
        query: queries.editCategoria,
        variables: {
          evento_id: event?._id,
          categoria_id: original?.categoriaID,
          updates: { nombre: values.value !== "" ? values.value : "nueva categoria" }
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

interface propsHandleDelete {
  showModalDelete: any
  event: Event
  setEvent: Dispatch<SetStateAction<Event>>
  setLoading: Dispatch<SetStateAction<boolean>>
  setShowModalDelete: Dispatch<SetStateAction<any>>
}

export const handleDelete = async ({ showModalDelete, event, setEvent, setLoading, setShowModalDelete }: propsHandleDelete) => {
  // BUG-P-02 (informe QA 22-jun): la versión anterior con Promise wrapper no
  // resolvía si el object no era reconocido o si fetchApiEventos lanzaba excepción
  // (resolve nunca se llamaba → spinner infinito). Refactor a async/await + try/finally
  // que GARANTIZA cerrar modal + reset loading en TODOS los casos.
  const { values } = showModalDelete
  setLoading(true)
  try {
    if (values?.object === "categoria") {
      await fetchApiEventos({
        query: queries.borraCategoria,
        variables: {
          evento_id: event?._id,
          categoria_id: values?._id,
        },
      })
      // Update inmutable (no splice mutante).
      setEvent((prev) => ({
        ...prev,
        presupuesto_objeto: {
          ...prev.presupuesto_objeto,
          categorias_array: prev.presupuesto_objeto.categorias_array.filter(cat => cat._id !== values?._id),
        },
      }))
    } else if (values?.object === "gasto") {
      await fetchApiEventos({
        query: queries.borrarGasto,
        variables: {
          evento_id: event?._id,
          categoria_id: values?.categoriaID,
          gasto_id: values?._id,
        },
      })
      // Update inmutable.
      setEvent((prev) => ({
        ...prev,
        presupuesto_objeto: {
          ...prev.presupuesto_objeto,
          categorias_array: prev.presupuesto_objeto.categorias_array.map(cat =>
            cat._id !== values?.categoriaID ? cat : {
              ...cat,
              gastos_array: cat.gastos_array.filter(g => g._id !== values?._id),
            }
          ),
        },
      }))
    } else if (values?.object === "item") {
      await fetchApiEventos({
        query: queries.borrarItemsGastos,
        variables: {
          evento_id: event?._id,
          categoria_id: values?.categoriaID,
          gasto_id: values?.gastoID,
          itemsGastos_ids: [values?._id],
        },
      })
      setEvent((prev) => ({
        ...prev,
        presupuesto_objeto: {
          ...prev.presupuesto_objeto,
          categorias_array: prev.presupuesto_objeto.categorias_array.map(cat =>
            cat._id !== values?.categoriaID ? cat : {
              ...cat,
              gastos_array: cat.gastos_array.map(gasto =>
                gasto._id !== values?.gastoID ? gasto : {
                  ...gasto,
                  items_array: gasto.items_array.filter(item => item._id !== values._id),
                }
              ),
            }
          ),
        },
      }))
    } else {
      console.warn('[handleDelete] object no reconocido:', values?.object, '— solo "categoria"/"gasto"/"item"')
    }
  } catch (error: any) {
    console.warn('[handleDelete] falló:', error?.message ?? error)
  } finally {
    // SIEMPRE ejecutar: cerrar modal + reset loading aunque el API falle.
    showModalDelete["setShowDotsOptionsMenu"] && showModalDelete?.setShowDotsOptionsMenu({ state: false })
    setShowModalDelete({ state: false })
    setLoading(false)
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
      // Inmutable: añadir item a categorias→gastos→items.
      setEvent((prev) => ({
        ...prev,
        presupuesto_objeto: {
          ...prev.presupuesto_objeto,
          categorias_array: prev.presupuesto_objeto.categorias_array.map(cat =>
            cat._id !== info?.row?.original?.categoriaID ? cat : {
              ...cat,
              gastos_array: cat.gastos_array.map(gasto =>
                gasto._id != info?.row?.original?.gastoID ? gasto : {
                  ...gasto,
                  items_array: [...(gasto.items_array ?? []), result],
                }
              ),
            }
          ),
        },
      }))
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
      // Inmutable: añadir gasto a categorias[].gastos_array.
      setEvent((prev) => ({
        ...prev,
        presupuesto_objeto: {
          ...prev.presupuesto_objeto,
          categorias_array: prev.presupuesto_objeto.categorias_array.map(cat =>
            cat._id !== info?.row?.original?.categoriaID ? cat : {
              ...cat,
              gastos_array: [...(cat.gastos_array ?? []), result],
            }
          ),
        },
      }))
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
      // Test 34 (informe QA 22-jun): si el API devuelve null/sin _id, no podemos
      // crear el gasto inicial (categoria_id sería null → API 400).
      if (!result || !result._id) {
        console.warn("[handleCreateCategoria] nuevoCategoria devolvió result null/sin _id", result)
        return
      }
      // Paso 1: añadir categoría nueva (inmutable).
      const nuevaCategoria = { ...result, gastos_array: [] as any[] }
      setEvent((prev) => ({
        ...prev,
        presupuesto_objeto: {
          ...prev.presupuesto_objeto,
          categorias_array: [...prev.presupuesto_objeto.categorias_array, nuevaCategoria],
        },
      }))
      // Paso 2: añadir gasto inicial a la categoría recién creada.
      fetchApiEventos({
        query: queries.nuevoGasto,
        variables: {
          evento_id: event?._id,
          categoria_id: result._id,
          nombre: "Nueva part. de gasto",
        }
      }).then((resultGasto: expenses) => {
        // Test 34: si el API de gasto devuelve null, NO mutar el array (antes se
        // metía resultGasto = null en gastos_array → la categoría quedaba "rota").
        if (!resultGasto || !(resultGasto as any)._id) {
          console.warn("[handleCreateCategoria] nuevoGasto devolvió result null/sin _id", resultGasto)
          return
        }
        setEvent((prev) => ({
          ...prev,
          presupuesto_objeto: {
            ...prev.presupuesto_objeto,
            categorias_array: prev.presupuesto_objeto.categorias_array.map(cat =>
              cat._id !== result._id ? cat : {
                ...cat,
                gastos_array: [...(cat.gastos_array ?? []), resultGasto],
              }
            ),
          },
        }))
      })
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

  console.log('entro en el gasto')

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
      const newEstatus = result.categorias_array[f1].gastos_array[f2].estatus
      setEvent((prev) => ({
        ...prev,
        presupuesto_objeto: {
          ...prev.presupuesto_objeto,
          categorias_array: prev.presupuesto_objeto.categorias_array.map((cat, ci) =>
            ci !== f1 ? cat : {
              ...cat,
              gastos_array: cat.gastos_array.map((gasto, gi) =>
                gi !== f2 ? gasto : { ...gasto, estatus: newEstatus }
              ),
            }
          ),
        },
      }))
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

  console.log('Entro')

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
      // Recalcular el coste_final del gasto excluyendo items ocultos
      const gasto = event.presupuesto_objeto.categorias_array[f1].gastos_array[f2];
      const SumaTotalItems = gasto.items_array.reduce((acumulador, item) => {
        // Excluir items ocultos del cálculo
        if (item.estatus === false) {
          return acumulador;
        }
        return acumulador + (item.total || 0);
      }, 0);
      
      // Actualizar el coste_final del gasto
      event.presupuesto_objeto.categorias_array[f1].gastos_array[f2].coste_final = SumaTotalItems;
      
      // Recalcular el coste_final de la categoría sumando todos los gastos
      const sumaTotalesGastos = event.presupuesto_objeto.categorias_array[f1].gastos_array.reduce(
        (acumulador, item) => acumulador + (item.coste_final || 0), 
        0
      );
      
      // Actualizar el coste_final de la categoría en el contexto
      const nuevasCategorias = event.presupuesto_objeto.categorias_array.map((cat, idx) =>
        idx === f1 ? { ...cat, coste_final: sumaTotalesGastos } : cat
      );
      
      // Actualizar el contexto
      setEvent(prev => ({
        ...prev,
        presupuesto_objeto: {
          ...prev.presupuesto_objeto,
          categorias_array: nuevasCategorias
        }
      }));
    })
  } catch (error) {
    console.log(220046, error);
    throw new Error(error)
  }
}