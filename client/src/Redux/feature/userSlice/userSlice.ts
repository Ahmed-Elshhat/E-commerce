import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Axios } from "../../../Api/axios";
import { initialStateGetUser } from "../../../Types/app";
import { GET_ME } from "../../../Api/Api";

const initialState: initialStateGetUser = {
  loading: false,
  data: null,
  error: "",
};

const fetchUsers = createAsyncThunk("user/fetchUsers", async () => {
  try {
    const res = await Axios.get(`${GET_ME}`);
    if (res.status === 200) {
      return res.data.user;
    }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return null;
  }
});

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchUsers.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.data = action.payload;
      state.error = "";
    });

    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.loading = false;
      state.data = null;
      state.error = action.error.message ?? "An unknown error occurred";
    });
  },
});

export default userSlice.reducer;
export { fetchUsers };
