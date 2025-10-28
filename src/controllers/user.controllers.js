import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Category } from "../models/category.models.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access Token/ Refresh Token."
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend

  const { first_name, last_name, email, password, phone_no, monthly_budget } =
    req.body;

  // validation - required fields not empty

  if (
    [first_name, email, password, phone_no].some((field) => field?.trim() == "")
  ) {
    throw new ApiError(400, "Required fields have missing values.");
  }

  // email, phone number valid

  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(email) || phone_no.trim().length !== 10) {
    throw new ApiError(400, "Invalid Email or Phone Number.");
  }

  // user doesnot exist already using email and phone number

  const existing = await User.findOne({
    $or: [{ email }, { phone_no }],
  });
  if (existing) {
    throw new ApiError(
      400,
      "User with this Phone Number or Email already exists."
    );
  }

  // check for avatar, upload on cloudinary

  const avatarLocalPath = req.file?.path;

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

const loginUser = asyncHandler(async (req, res) => {
  // email and password from frontend
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and Password is required.");
  }

  // find user

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist.");
  }

  // validate and compare both

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect Password.");
  }

  // authenticate user with access token and refresh token

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // send tokens in cookies

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  // return reponse

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User Logged in Successfully."
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request.");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token.");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used.");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshTokenefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token refreshed successfully."
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Something went wrong while refreshing access token."
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid password.");
  }

  user.password = newPassword;
  user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password has been updated."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "User retrieved successfully."));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, phone_no, monthly_budget } = req.body;

  if (!first_name && !last_name && !email && !phone_no && !monthly_budget) {
    throw new ApiError(400, "Missing field values");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        first_name,
        last_name,
        email,
        phone_no,
        monthly_budget,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully."));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required.");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(500, "Error while uploading to cloudinary.");
  }

  const deleteURL = req.user?.avatar;
  await deleteFromCloudinary(deleteURL);

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully."));
});

const addCategory = asyncHandler(async (req, res) => {
  const { title, budget, colour } = req.body;

  if (!title || !budget || !colour) {
    throw new ApiError(400, "Missing field values.");
  }

  const iconLocalPath = req.file?.path;

  if (!iconLocalPath) {
    throw new ApiError(400, "Icon is required.");
  }

  const icon = await uploadOnCloudinary(iconLocalPath);

  if (!icon.url) {
    throw new ApiError(500, "Error while uploading to cloudinary.");
  }

  const category = await Category.create({
    user: req.user?._id,
    title,
    budget,
    icon: icon.url,
    colour,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category created successfully."));
});

const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ user: req.user?._id });

  if (!categories) {
    throw new ApiError(500, "Something went wrong while fetching categories.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories fetched successfully."));
});

const updateCategory = asyncHandler(async (req, res) => {
  const { title, budget, colour } = req.body;
  const id = req.params.id;

  if (!id) {
    throw new ApiError(400, "No category to update.");
  }

  if (!title && !budget && !colour) {
    throw new ApiError(400, "No field to update.");
  }

  const category = await Category.findOneAndUpdate(
    { user: req.user?._id, _id: id },
    {
      title,
      budget,
      colour,
    },
    {
      new: true,
    }
  );

  if (!category) {
    throw new ApiError(500, "Something went wrong while updating category.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category updated successfully."));
});

const updateCategoryIcon = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!id) {
    throw new ApiError(400, "No category to update.");
  }

  const iconLocalPath = req.file?.path;

  if (!iconLocalPath) {
    throw new ApiError(400, "Icon is required.");
  }

  const icon = await uploadOnCloudinary(iconLocalPath);

  if (!icon.url) {
    throw new ApiError(500, "Error while uploading to cloudinary.");
  }

  const deleteURL = await Category.findById(id);
  await deleteFromCloudinary(deleteURL);

  const category = await Category.findOneAndUpdate(
    { _id: id, user: req.user?._id },
    {
      icon: icon.url,
    },
    { new: true }
  );

  if (!category) {
    throw new ApiError(
      500,
      "Something went wrong while updating category icon."
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, category, "Category icon updated successfully.")
    );
});

const deleteCategory = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!id) {
    throw new ApiError(400, "No category to delete.");
  }

  const category = await Category.findOneAndDelete({
    _id: id,
    user: req.user?._id,
  });

  if (!category) {
    throw new ApiError(500, "Something went wrong while deleting category.");
  }

  const deleteURL=category.icon
  await deleteFromCloudinary(deleteURL)

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Category deleted successfully."));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  addCategory,
  listCategories,
  updateCategory,
  updateCategoryIcon,
  deleteCategory
};
