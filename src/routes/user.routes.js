import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  addCategory,
  updateCategory,
  updateCategoryIcon,
  deleteCategory,
  listCategories,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(upload.single("avatar"), registerUser);

router.route("/login").post(loginUser);

//Secured routes

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-access-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/account-details").patch(verifyJWT, updateAccountDetails);

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router.route("/categories").post(verifyJWT, upload.single("icon"), addCategory);

router.route("/categories").get(verifyJWT, listCategories);

router.route("/categories/:id").patch(verifyJWT, updateCategory);

router.route("/categories-icon/:id").patch(verifyJWT, upload.single("icon"), updateCategoryIcon);

router.route("/categories/:id").delete(verifyJWT, deleteCategory);

export default router;
