import { ColumnDef, flexRender, getCoreRowModel, SortingState, getPaginationRowModel, getSortedRowModel, useReactTable, Row, Header, Cell } from "@tanstack/react-table"
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import React, { useState } from "react";
import { FcGenericSortingAsc, FcGenericSortingDesc } from "react-icons/fc";
// needed for table body level scope DnD setup
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  type UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable'

// needed for row & cell level scope DnD setup
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CSSProperties } from 'react';
import { Data } from "./assets/MOCK_DATA";

// Cell Component
const RowDragHandleCell = ({ rowId }: { rowId: string }) => {
  const { attributes, listeners } = useSortable({
    id: rowId,
  })
  return (
    // Alternatively, you could set these attributes on the rows themselves
    <button {...attributes} {...listeners}>
      🟰
    </button>
  )
}


const DraggableTableHeader = ({
  header,
}: {
  header: Header<Data, unknown>
}) => {
  const { isDragging, attributes, listeners, setNodeRef, transform } =
    useSortable({
      id: header.column.id,
    })

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    flexDirection: 'column-reverse',
    gap: '0.5rem',
    transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
    transition: 'width transform 0.2s ease-in-out',
    whiteSpace: 'nowrap',
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  }
  return (
    <th colSpan={header.colSpan} ref={setNodeRef} style={{
      cursor: `${header.column.getCanSort() ? "pointer" : "unset"}`
      , ...style
    }} key={header.id} onClick={header.column.getToggleSortingHandler()}>
      <button style={{ width: "100%" }} {...attributes} {...listeners}>
        🟰
      </button>
      <div style={{ marginTop: '0.5rem' }}>

        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())
        }
        <span className="primary" style={{ marginLeft: "8px" }}>
          {{
            asc: <FcGenericSortingAsc />,
            desc: <FcGenericSortingDesc />,
          }[header.column.getIsSorted() as string] ?? null}
        </span>
      </div>



    </th>
  )
}

const DragAlongCell = ({ cell }: { cell: Cell<Data, unknown> }) => {
  const { isDragging, setNodeRef, transform } = useSortable({
    id: cell.column.id,
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
    transition: 'width transform 0.2s ease-in-out',
    width: cell.column.getSize(),
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <td style={style} ref={setNodeRef}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </td>
  );
};

// Row Component
const DraggableRow = ({ row }: { row: Row<Data> }) => {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform), //let dnd-kit do its thing
    transition: transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative',
  }
  return (
    // connect row ref to dnd-kit, apply important styles
    <tr ref={setNodeRef} style={style}>
      {row.getVisibleCells().map(cell => (
        <td key={cell.id} style={{ width: cell.column.getSize() }}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  )
}

interface DataTableProp<TData> {
  data: TData[],
  pageSize?: number,
  isPagination?: true
}

const CustomerCol: ColumnDef<Data>[] = [
  {
    id: 'drag-handle',
    header: 'Move',
    cell: ({ row }) => <RowDragHandleCell rowId={row.id} />,
    size: 60,
  },
  {
    header: "Id",
    id: "id",
    accessorKey: "id",
    cell: info => info.getValue(),
  },
  {
    header: "First Name",
    id: "first_name",
    accessorKey: "first_name",
    cell: info => info.getValue(),

  },
  {
    header: "Last Name",
    id: "last_name",
    cell: info => info.getValue(),
    accessorKey: "last_name"
  },
  {
    header: "Gender",
    id: "gender",
    cell: info => info.getValue(),
    accessorKey: "gender"
  },
  {
    header: "Email",
    id: "email",
    cell: info => info.getValue(),
    accessorKey: "email"
  },
  {
    header: "Address",
    id: "address",
    cell: info => info.getValue(),
    accessorKey: "address"
  },
]

function GetTable({ data, pageSize = 5, isPagination }: DataTableProp<Data>) {
  const [columnHover, setColumnHover] = React.useState(false);
  const [tableData , setTableData] = React.useState<Data[]>(data) ;
  const [columnOrder, setColumnOrder] = React.useState<string[]>(() =>
    CustomerCol.map(c => c.id!)
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id),
    [data]
  )
  const [sorting, setSorting] = useState<SortingState>([])
  const { getHeaderGroups, getRowModel, previousPage, nextPage, getCanNextPage, getCanPreviousPage, getPageCount, getState } = useReactTable({
    columns: CustomerCol,
    data : tableData,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id.toString(), //required because row indexes will change
    onColumnOrderChange: setColumnOrder,
    debugHeaders: true,
    debugColumns: true,
    state: {
      sorting, columnOrder
    },
    initialState: {
      pagination: {
        pageSize,
        pageIndex: 0
      }
    }
  })

  // reorder rows after drag & drop
  // reorder columns after drag & drop
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if(over == null){
      setColumnHover(false)
    }
    else{
      setColumnHover(true)
    }
    if (active && over && active.id !== over.id) {
      if (columnHover == true) {
        setColumnOrder(columnOrder => {
          const oldIndex = columnOrder.indexOf(active.id as string)
          const newIndex = columnOrder.indexOf(over.id as string)
          return arrayMove(columnOrder, oldIndex, newIndex) //this is just a splice util
        })
      }
      else {
        setTableData(data => {
          const oldIndex = dataIds.indexOf(active.id)
          const newIndex = dataIds.indexOf(over.id)
          return arrayMove(data, oldIndex, newIndex) //this is just a splice util
        })
      }

    }

  }
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  return (
    <>
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[columnHover ? restrictToHorizontalAxis : restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >

        <table >
          <thead  >
            {getHeaderGroups().map(hg => {
              return (
                <tr key={hg.id}>
                  <SortableContext
                    items={columnHover ? columnOrder : dataIds}
                    strategy={columnHover ? horizontalListSortingStrategy : verticalListSortingStrategy}
                  >
                    {hg.headers.map(header => {
                      return (<DraggableTableHeader key={header.id} header={header} />)
                    })}
                  </SortableContext>
                </tr>)
            })}
          </thead>
          <tbody>
            {
              columnHover ?
                getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <SortableContext
                        key={cell.id}
                        items={columnOrder}
                        strategy={horizontalListSortingStrategy}
                      >
                        <DragAlongCell key={cell.id} cell={cell} />
                      </SortableContext>
                    ))}
                  </tr>
                ))
                : <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >  {getRowModel().rows.map(row => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
            }
          </tbody>
        </table>
        </DndContext>
        {isPagination && (getPageCount() > 1) && <div className="pagination">
          <button disabled={!getCanPreviousPage()} onClick={() => previousPage()} className="pre primary-bg"><FaArrowLeft /></button>
          <span className="page-details">
            {getState().pagination.pageIndex + 1} of {getPageCount()}
          </span>
          <button disabled={!getCanNextPage()} onClick={() => nextPage()} className="next primary-bg"><FaArrowRight /></button>
        </div>}
  
    </>
  )

}


export default GetTable
