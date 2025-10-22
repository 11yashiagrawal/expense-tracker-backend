import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend

  const {
    first_name,
    last_name,
    email,
    password,
    phone_no,
    monthly_budget,
    balance,
  } = req.body;

  // validation - required fields not empty

  if (
    [first_name, email, password, phone_no].some((field) => field?.trim() == "")
  ) {
    throw new ApiError(400, "Required fields have missing values.");
  }

  // email, phone number valid

  const emailPattern = "/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/";
  if (!emailPattern.test(email) || length(phone_no.trim()) !== 10) {
    throw new ApiError(400, "Invalid Email or Phone Number.");
  }

  // user doesnot exist already using email and phone number

  const existing = User.findOne({
    $or: [{ email }, { phone_no }],
  });
  if (existing) {
    throw new ApiError(
      400,
      "User with this Phone Number or Email already exists."
    );
  }

  // check for avatar, upload on cloudinary

  const avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required.");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required.");
  }

  // create user object - store in db

  const user = await User.create({
    first_name,
    last_name,
    avatar: avatar.url,
    email,
    password,
    phone_no,
    monthly_budget,
    balance,
  });

  // check for user creation and remove refresh token, password

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user.");
  }

  // return response

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully."));
});

export { registerUser };
