import { Query } from '../types';

export interface QueryState {
  queries: Query[];
}

const initialState: QueryState = {
  queries: [],
};

const ADD_QUERY = 'ADD_QUERY';
const UPDATE_QUERY = 'UPDATE_QUERY';
const DELETE_QUERY = 'DELETE_QUERY';
const SET_QUERIES = 'SET_QUERIES';
const REPLACE_QUERIES = 'REPLACE_QUERIES';

interface AddQueryAction {
  type: typeof ADD_QUERY;
  payload: Query;
}

interface UpdateQueryAction {
  type: typeof UPDATE_QUERY;
  payload: Query;
}

interface DeleteQueryAction {
  type: typeof DELETE_QUERY;
  payload: {
    id: string;
    deletedAt: string;
  };
}

interface SetQueriesAction {
  type: typeof SET_QUERIES;
  payload: Query[];
}

interface ReplaceQueriesAction {
  type: typeof REPLACE_QUERIES;
  payload: Query[];
}

export type QueryAction =
  | AddQueryAction
  | UpdateQueryAction
  | DeleteQueryAction
  | SetQueriesAction
  | ReplaceQueriesAction;

export const addQuery = (query: Query): AddQueryAction => ({
  type: ADD_QUERY,
  payload: query,
});

export const updateQuery = (query: Query): UpdateQueryAction => ({
  type: UPDATE_QUERY,
  payload: query,
});

export const deleteQuery = (id: string): DeleteQueryAction => ({
  type: DELETE_QUERY,
  payload: { id, deletedAt: new Date().toISOString() },
});

export const setQueries = (queries: Query[]): SetQueriesAction => ({
  type: SET_QUERIES,
  payload: queries,
});

export const replaceQueries = (queries: Query[]): ReplaceQueriesAction => ({
  type: REPLACE_QUERIES,
  payload: queries,
});

const withUpdatedAt = <T extends Query>(query: T): T => ({
  ...query,
  updatedAt: new Date().toISOString(),
});

const queryReducer = (state = initialState, action: QueryAction): QueryState => {
  switch (action.type) {
    case ADD_QUERY:
      return {
        ...state,
        queries: [withUpdatedAt(action.payload), ...state.queries],
      };
    case UPDATE_QUERY:
      return {
        ...state,
        queries: state.queries.map((query) =>
          query.id === action.payload.id ? withUpdatedAt({ ...query, ...action.payload }) : query
        ),
      };
    case DELETE_QUERY:
      return {
        ...state,
        queries: state.queries.map((query) =>
          query.id === action.payload.id
            ? withUpdatedAt({ ...query, isDeleted: true, deletedAt: action.payload.deletedAt })
            : query
        ),
      };
    case SET_QUERIES:
      return {
        ...state,
        queries: action.payload.map((query) => ({
          ...query,
          updatedAt: query.updatedAt || new Date().toISOString(),
        })),
      };
    case REPLACE_QUERIES:
      return {
        ...state,
        queries: action.payload,
      };
    default:
      return state;
  }
};

export default queryReducer;
