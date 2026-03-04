import {
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
  Reducer,
  useReducer,
} from "react";

interface state {
  arrIDs: string[];
  checkedAll: boolean;
}

type Context = {
  dataTableGroup: state;
  dispatch: Dispatch<SetStateAction<action>>;
};

const initialContext = {
  dataTableGroup: {
    arrIDs: [],
    checkedAll: false,
  },
  dispatch: (action: action): void => null,
};

enum actions {
    ADD_ROW_SELECTED,
    REMOVE_ROW_SELECTED,
    CHANGE_STATE_CHECKALL,
    RESET_STATE
}

type action = {
  type: keyof typeof actions;
  payload?: any;
};

const reducer: Reducer<state, action> = (state: state, action: action) => {
  switch (action.type) {
    case "ADD_ROW_SELECTED":
      return {...state, arrIDs : [...state.arrIDs, action.payload]}
      break;
    case "REMOVE_ROW_SELECTED":
        const newArr = state.arrIDs.filter(item => item !== action.payload)
        return {
            ...state,
            arrIDs: newArr
        }
      break;
    case "CHANGE_STATE_CHECKALL":
        return {
            ...state,
            checkedAll: action.payload
        }
      break;
    case "RESET_STATE":
        return initialContext.dataTableGroup
      break;

    default:
      return state;
      break;
  }
};

const DataTableContext = createContext<Context>(initialContext);

const DataTableGroupProvider = ({ children }) => {
  const [dataTableGroup, dispatch] = useReducer(reducer, initialContext.dataTableGroup);

  return (
    <DataTableContext.Provider value={{ dataTableGroup, dispatch }}>
      {children}
    </DataTableContext.Provider>
  );
};

const DataTableGroupContextProvider = () => useContext(DataTableContext);
export { DataTableGroupContextProvider, DataTableGroupProvider };
