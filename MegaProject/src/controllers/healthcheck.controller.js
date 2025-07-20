import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// Controller to check the health status
const healthcheck = asyncHandler(async (req, res) => {
  // Return the OK response
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    {},
    "OK"
  ))
})

export { healthcheck };
    