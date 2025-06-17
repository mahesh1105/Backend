class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode
    this.data = data
    this.message = message
    this.success = statusCode < 400 // Not any hard and fast rule, but usually above 400 will be error - Standards
  }
}