import { Router } from 'express'
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAcesssToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// router.route('/register').post(registerUser)

// Added a middleware for multer file upload before user registration
router.route('/register').post(
  // adding multer middleware for file uploads
  upload.fields([
    {
      name: "avatar",        // This creates req.files.avatar
      maxCount: 1
    },
    {
      name: "coverImage",    // This creates req.files.coverImage
      maxCount: 1
    }
  ]),
  registerUser
)

router.route('/login').post(loginUser)

// Secured routes
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-token').post(refreshAcesssToken)

router.route('/change-password').post(verifyJWT, changeCurrentPassword)
router.route('/current-user').get(verifyJWT, getCurrentUser)
router.route('/update-account').patch(verifyJWT, updateAccountDetails)

router.route('/avatar').patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route('/cover-image').patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route('/channel/:username').get(verifyJWT, getUserChannelProfile)
router.route('/watch-history').get(verifyJWT, getWatchHistory)

export default router;