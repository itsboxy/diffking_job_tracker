import { Booking } from '../types';

export interface BookingState {
  bookings: Booking[];
}

const initialState: BookingState = {
  bookings: [],
};

const ADD_BOOKING = 'ADD_BOOKING';
const UPDATE_BOOKING = 'UPDATE_BOOKING';
const DELETE_BOOKING = 'DELETE_BOOKING';
const SET_BOOKINGS = 'SET_BOOKINGS';
const REPLACE_BOOKINGS = 'REPLACE_BOOKINGS';

interface AddBookingAction {
  type: typeof ADD_BOOKING;
  payload: Booking;
}

interface UpdateBookingAction {
  type: typeof UPDATE_BOOKING;
  payload: Booking;
}

interface DeleteBookingAction {
  type: typeof DELETE_BOOKING;
  payload: {
    id: string;
    deletedAt: string;
  };
}

interface SetBookingsAction {
  type: typeof SET_BOOKINGS;
  payload: Booking[];
}

interface ReplaceBookingsAction {
  type: typeof REPLACE_BOOKINGS;
  payload: Booking[];
}

export type BookingAction =
  | AddBookingAction
  | UpdateBookingAction
  | DeleteBookingAction
  | SetBookingsAction
  | ReplaceBookingsAction;

export const addBooking = (booking: Booking): AddBookingAction => ({
  type: ADD_BOOKING,
  payload: booking,
});

export const updateBooking = (booking: Booking): UpdateBookingAction => ({
  type: UPDATE_BOOKING,
  payload: booking,
});

export const deleteBooking = (id: string): DeleteBookingAction => ({
  type: DELETE_BOOKING,
  payload: { id, deletedAt: new Date().toISOString() },
});

export const setBookings = (bookings: Booking[]): SetBookingsAction => ({
  type: SET_BOOKINGS,
  payload: bookings,
});

export const replaceBookings = (bookings: Booking[]): ReplaceBookingsAction => ({
  type: REPLACE_BOOKINGS,
  payload: bookings,
});

const withUpdatedAt = <T extends Booking>(booking: T): T => ({
  ...booking,
  updatedAt: new Date().toISOString(),
});

const bookingReducer = (state = initialState, action: BookingAction): BookingState => {
  switch (action.type) {
    case ADD_BOOKING:
      return {
        ...state,
        bookings: [withUpdatedAt({ status: 'confirmed', ...action.payload }), ...state.bookings],
      };
    case UPDATE_BOOKING:
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.payload.id ? withUpdatedAt({ ...booking, ...action.payload }) : booking
        ),
      };
    case DELETE_BOOKING:
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.payload.id
            ? withUpdatedAt({ ...booking, isDeleted: true, deletedAt: action.payload.deletedAt })
            : booking
        ),
      };
    case SET_BOOKINGS:
      return {
        ...state,
        bookings: action.payload.map((booking) => ({
          ...booking,
          updatedAt: booking.updatedAt || new Date().toISOString(),
        })),
      };
    case REPLACE_BOOKINGS:
      return {
        ...state,
        bookings: action.payload,
      };
    default:
      return state;
  }
};

export default bookingReducer;
