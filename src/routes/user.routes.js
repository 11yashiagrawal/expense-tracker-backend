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

router.route("/refreshAccessToken").post(refreshAccessToken);

router.route("/changePassword").post(verifyJWT, changeCurrentPassword);

router.route("/currentUser").get(verifyJWT, getCurrentUser);

router.route("/updateAccountDetails").patch(verifyJWT, updateAccountDetails);

router.route("/updateAvatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router.route("/addCategory").post(verifyJWT, upload.single("icon"), addCategory);

router.route("/allCategories").get(verifyJWT, listCategories);

router.route("/updateCategory/:id").patch(verifyJWT, updateCategory);

router.route("/updateCategoryIcon/:id").patch(verifyJWT, upload.single("icon"), updateCategoryIcon);

router.route("/deleteCategory/:id").delete(verifyJWT, deleteCategory);

router
  .route("/updateAvatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

export default router;
