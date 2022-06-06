import { Types } from 'mongoose';
import React, { useState, useEffect, useContext } from 'react'
import { api } from '../api'
import { useTable, usePagination } from 'react-table'


function Table({ columns, data }) {
  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    page, // Instead of using 'rows', we'll use page,
    // which has only the rows for the active page

    // The rest of these things are super handy, too ;)
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable({
    columns,
    data,
    initialState: { pageIndex: 0 },
  },
    usePagination)

  // Render the UI for your table
  return (
    <>
      <pre>
        <code>
          {JSON.stringify(
            {
              pageIndex,
              pageSize,
              pageCount,
              canNextPage,
              canPreviousPage,
            },
            null,
            2
          )}
        </code>
      </pre>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()} key="1">
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()} key="">{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row, i) => {
            prepareRow(row)
            return (
              <tr {...row.getRowProps()} key="2">
                {row.cells.map(cell => {
                  return <td {...cell.getCellProps()} key="">{cell.render('Cell')}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      {/* 
        Pagination can be built however you'd like. 
        This is just a very basic UI implementation:
      */}
      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>{' '}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>{' '}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>{' '}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>{' '}
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <span>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              gotoPage(page)
            }}
            style={{ width: '100px' }}
          />
        </span>{' '}
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}


const Registrolog = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    const llamada = async () => {
      try {
        const params = {
          query: `
                    query {
                        queryLog {
                        _id,usuario_id,logs_array {evento_id,fecha,tipo,descripcion}
                        }
                    }
                `,
          variables: {},
        }
        const { data } = await api.ApiBodas(props)
        const { logs_array } = data.data.queryLog[0]
        setData(logs_array)
      } catch (error) {
        console.log(error)
      }
    }
    const asdf = llamada()
  }, [])
  let linea = 0
  const array1 = [1, 2, 3]

  /*const columns3 = React.useMemo(
    () =>
      [{
        Header: 'Product ID',
        accessor: 'id'
      }, {
        Header: 'Product Name',
        accessor: 'name'
      }, {
        Header: 'Product Value',
        accessor: 'value'
      }],

    []
  )

  const data3 = React.useMemo(
    () => [
      { id: 1, name: 'Gob', value: '2' },
      { id: 2, name: 'Buster', value: '5' },
      { id: 3, name: 'George Michael', value: '4' }
    ],
    []
  )*/
  const Columns2 = React.useMemo(
    () =>
      [{
        Header: 'Fecha',
        accessor: row => parseInt(row.fecha)
      }, {
        Header: 'Evento_id',
        accessor: 'evento_id'
      }, {
        Header: 'Tipo',
        accessor: 'tipo'
      }, {
        Header: 'Descripción',
        accessor: 'descripcion'
      }],

    []
  )
  /*
    const data2 = React.useMemo(
      () => [
        { id: 1, name: 'Gob', value: '2' },
        { id: 2, name: 'Buster', value: '5' },
        { id: 3, name: 'George Michael', value: '4' }
      ],
      []
    )*/
  return (
    <Table columns={Columns2} data={data} />

  )
}
export default Registrolog
/*
        {data.map( (linea,i) => (
                <div key={i}>
                    <li>{`fecha. ${moment(parseInt(linea.fecha)).format("DD-MM-YYYY, h:mm:ss a")}; evento_id: ${linea.evento_id}, tipo: ${linea.tipo}, descripción: ${linea.descripcion}`}</li>
                </div>
            )
        )}
        <Table columns={columns3} data={data3} />
*/