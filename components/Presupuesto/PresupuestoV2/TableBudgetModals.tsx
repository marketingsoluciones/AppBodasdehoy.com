import React from 'react';
import ClickAwayListener from 'react-click-away-listener';
import { ColumnsConfigModal } from './modals/ColumnsConfigModal';
import { FiltersModal } from './modals/FiltersModal';
import { EventInfoModal } from './modals/EventInfoModal';
import { TableBudgetOptionsMenu } from './TableBudgetOptionsMenu';

export const TableBudgetModals = ({
  showColumnsModal,
  setShowColumnsModal,
  columnConfig,
  toggleColumnVisibility,
  showFiltersModal,
  setShowFiltersModal,
  filters,
  handleFilterChange,
  handleClearFilters,
  categorias_array,
  viewLevel,
  setViewLevel,
  showOptionsModal,
  setShowOptionsModal,
  showEventInfoModal,
  setShowEventInfoModal,
  event,
  getCategoriasForModal,
  getModalTotals,
  formatNumber,
  RelacionarPagoModal,
  setRelacionarPagoModal,
  FormAddPago,
  ServisiosListModal,
  setServisiosListModal,
  ModalTaskList,
  showFloatOptionsMenu,
  setShowFloatOptionsMenu,
  FloatOptionsMenu,
  options
}) => (
  <>
    {showColumnsModal && (
      <ColumnsConfigModal
        columnConfig={columnConfig}
        toggleColumnVisibility={toggleColumnVisibility}
        onClose={() => setShowColumnsModal(false)}
      />
    )}
    {showFiltersModal && (
      <FiltersModal
        filters={filters}
        onFilterChange={handleFilterChange}
        onClose={() => setShowFiltersModal(false)}
        onClearFilters={handleClearFilters}
        categorias_array={categorias_array}
        viewLevel={viewLevel}
        setViewLevel={setViewLevel}
      />
    )}
    {showOptionsModal.show && (
      <ClickAwayListener onClickAway={() => setShowOptionsModal({ show: false })}>
        <TableBudgetOptionsMenu showOptionsModal={showOptionsModal} setShowOptionsModal={setShowOptionsModal} options={options} />
      </ClickAwayListener>
    )}
    {showEventInfoModal && (
      <EventInfoModal
        event={event}
        currency={event?.presupuesto_objeto?.currency}
        categorias_array={getCategoriasForModal()}
        totalStimatedGuests={event?.presupuesto_objeto?.totalStimatedGuests || { adults: 0, children: 0 }}
        totals={getModalTotals()}
        formatNumber={formatNumber}
        onClose={() => setShowEventInfoModal(false)}
      />
    )}
    {RelacionarPagoModal.crear && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <ClickAwayListener onClickAway={() => RelacionarPagoModal.crear && setRelacionarPagoModal({ id: "", crear: false, categoriaID: "" })}>
          <div className="relative bg-white rounded-xl shadow-lg p-8 w-full max-w-xl h-[90%] overflow-auto">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition transform hover:scale-110"
              onClick={() => setRelacionarPagoModal({ id: "", crear: false, categoriaID: "" })}
            >
              ✕
            </button>
            {FormAddPago && (
              <FormAddPago
                GastoID={RelacionarPagoModal?.id}
                cate={RelacionarPagoModal?.categoriaID}
                setGastoID={setRelacionarPagoModal}
              />
            )}
          </div>
        </ClickAwayListener>
      </div>
    )}
    {ServisiosListModal.crear && (
      <ClickAwayListener onClickAway={() => ServisiosListModal.crear && setServisiosListModal({ id: "", crear: false, categoriaID: "" })}>
        <div>
          {ModalTaskList && (
            <ModalTaskList
              setModal={setServisiosListModal}
              categoria={ServisiosListModal?.categoriaID}
              gasto={ServisiosListModal?.id}
              event={event}
              setEvent={event.setEvent}
            />
          )}
        </div>
      </ClickAwayListener>
    )}
    {showFloatOptionsMenu?.state && !showOptionsModal.show && (
      FloatOptionsMenu && <FloatOptionsMenu showOptionsMenu={showFloatOptionsMenu} setShowOptionsMenu={setShowFloatOptionsMenu} />
    )}
  </>
); 